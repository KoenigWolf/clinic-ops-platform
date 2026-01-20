import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";
import { logAuthEvent } from "./audit";
import { sanitizeEmail, SESSION_CONFIG } from "./security";

declare module "next-auth" {
  interface User {
    role: UserRole;
    tenantId: string;
  }
  interface Session {
    user?: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      tenantId: string;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    tenantId?: string;
    iat?: number; // Issued at timestamp
    lastActivity?: number; // Last activity timestamp for idle timeout
  }
}

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

type LoginAttempt = {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
};

// In-memory login attempt tracking (use Redis in production)
const loginAttempts = new Map<string, LoginAttempt>();

/**
 * Check if account is locked due to too many failed attempts
 */
function isAccountLocked(email: string): boolean {
  const attempts = loginAttempts.get(email);
  if (!attempts?.lockedUntil) return false;
  if (attempts.lockedUntil < Date.now()) {
    loginAttempts.delete(email);
    return false;
  }
  return true;
}

function getLoginAttempt(email: string): LoginAttempt {
  const now = Date.now();
  const attempts = loginAttempts.get(email);
  if (!attempts || now - attempts.firstAttemptAt > LOCKOUT_DURATION_MS) {
    return { count: 0, firstAttemptAt: now };
  }
  return attempts;
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(email: string): void {
  const attempts = getLoginAttempt(email);
  attempts.count++;
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  loginAttempts.set(email, attempts);
}

/**
 * Clear login attempts on successful login
 */
function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailInput =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        const email = sanitizeEmail(emailInput);

        if (!email || !password) {
          return null;
        }

        // Check for account lockout
        if (isAccountLocked(email)) {
          // Log the lockout attempt
          const user = await prisma.user.findUnique({
            where: { email },
            select: { tenantId: true },
          });
          if (user) {
            await logAuthEvent({
              action: "LOGIN_FAILED",
              tenantId: user.tenantId,
              metadata: { reason: "ACCOUNT_LOCKED", email },
            });
          }
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });

        if (!user || !user.passwordHash || !user.isActive) {
          // Record failed attempt even for non-existent users (prevent enumeration)
          recordFailedAttempt(email);
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          recordFailedAttempt(email);
          // Log failed login attempt
          await logAuthEvent({
            action: "LOGIN_FAILED",
            userId: user.id,
            tenantId: user.tenantId,
            metadata: { reason: "INVALID_PASSWORD" },
          });
          return null;
        }

        // Successful login
        clearLoginAttempts(email);

        // Log successful login
        await logAuthEvent({
          action: "LOGIN",
          userId: user.id,
          tenantId: user.tenantId,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const now = Math.floor(Date.now() / 1000);

      // Check for idle timeout (30 minutes)
      const IDLE_TIMEOUT = SESSION_CONFIG.idleTimeout; // seconds
      if (token.lastActivity && now - token.lastActivity > IDLE_TIMEOUT) {
        // Session expired due to inactivity
        delete token.id;
        delete token.role;
        delete token.tenantId;
        delete token.lastActivity;
        return token;
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.iat = now;
      }

      // Update last activity on every request
      if (token.id && (trigger === "update" || trigger === undefined)) {
        token.lastActivity = now;
      }

      return token;
    },
    async session({ session, token }) {
      // Check if token is valid (not expired)
      if (!token.id || !token.tenantId || !token.role) {
        // Return empty session to force re-login
        return { ...session, user: undefined };
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.tenantId = token.tenantId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on error
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_CONFIG.maxAge, // 24 hours absolute maximum
    updateAge: 5 * 60, // Update session every 5 minutes
  },
  // Security: Use secure cookies in production
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.callback-url"
        : "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Host-authjs.csrf-token"
        : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

// 同一リクエスト内でセッションをキャッシュ (RSC/Server Components用)
export const getSession = cache(async () => {
  return await auth();
});

// Export password validation for registration
export { validatePassword } from "./security";
