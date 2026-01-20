/**
 * Security utilities for the karute application
 * Implements defense-in-depth security measures
 *
 * Note: Uses Web Crypto API for Edge Runtime compatibility
 */

import { NextResponse, type NextRequest } from "next/server";

// ==================== Security Headers ====================

/**
 * Comprehensive security headers for defense in depth
 * Based on OWASP recommendations and modern security best practices
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS filter in older browsers
  "X-XSS-Protection": "1; mode=block",

  // Control referrer information leakage
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Disable features that could be misused
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",

  // Content Security Policy - strict but allows Next.js functionality
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for inline styles
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.daily.co wss://*.daily.co", // Daily.co for video
    "frame-src 'self' https://*.daily.co", // Daily.co video frames
    "media-src 'self' blob:", // For video streams
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),

  // HTTP Strict Transport Security (enable in production)
  ...(process.env.NODE_ENV === "production"
    ? {
        "Strict-Transport-Security":
          "max-age=31536000; includeSubDomains; preload",
      }
    : {}),
};

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// ==================== Rate Limiting ====================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Prefix for the rate limit key
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Strict limit for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
    keyPrefix: "auth",
  },
  // Standard API rate limit
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyPrefix: "api",
  },
  // File upload rate limit
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    keyPrefix: "upload",
  },
  // Strict limit for sensitive operations
  sensitive: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyPrefix: "sensitive",
  },
};

/**
 * Get client identifier for rate limiting
 * Uses IP address with forwarded headers support
 */
export function getClientIdentifier(request: NextRequest): string {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Get the first IP in the chain (original client)
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips[0]) {
      return ips[0];
    }
  }

  // Check for real IP header
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (should not happen in production)
  return "unknown";
}

/**
 * Check rate limit for a request
 * Returns true if the request should be allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${config.keyPrefix || "default"}:${identifier}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
    "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
  };
}

// ==================== CSRF Protection ====================

const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_COOKIE_NAME = "__Host-csrf-token";

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a cryptographically secure CSRF token
 * Uses Web Crypto API for Edge Runtime compatibility
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Create CSRF cookie settings
 */
export function getCsrfCookieSettings(token: string): string {
  const secure = process.env.NODE_ENV === "production";
  return [
    `${CSRF_COOKIE_NAME}=${token}`,
    "Path=/",
    "SameSite=Strict",
    "HttpOnly",
    ...(secure ? ["Secure"] : []),
    `Max-Age=${60 * 60 * 24}`, // 24 hours
  ].join("; ");
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * Works in Edge Runtime without Node.js crypto
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Skip for safe methods (GET, HEAD, OPTIONS)
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(request.method)) {
    return true;
  }

  // Skip for API routes that use different auth (tRPC has its own protection)
  if (request.nextUrl.pathname.startsWith("/api/trpc")) {
    return true;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  // Both must exist and match
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken);
}

// ==================== Input Sanitization ====================

/**
 * Sanitize string input to prevent XSS
 * Note: React automatically escapes JSX, but this is for non-React contexts
 */
export function sanitizeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

/**
 * Sanitize phone number (Japanese format)
 */
export function sanitizePhone(phone: string): string | null {
  // Remove all non-digit characters except hyphens
  const cleaned = phone.replace(/[^\d\-]/g, "");
  // Japanese phone number pattern
  const phoneRegex = /^0\d{1,4}-?\d{1,4}-?\d{4}$/;
  return phoneRegex.test(cleaned) ? cleaned : null;
}

// ==================== Password Security ====================

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

/**
 * Validate password strength
 * Returns null if valid, or an error message if invalid
 */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return `パスワードは${PASSWORD_REQUIREMENTS.minLength}文字以上必要です`;
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    return `パスワードは${PASSWORD_REQUIREMENTS.maxLength}文字以下にしてください`;
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return "パスワードには大文字を含めてください";
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return "パスワードには小文字を含めてください";
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    return "パスワードには数字を含めてください";
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    // Escape special regex chars and also escape hyphen for character class
    const escapedChars = PASSWORD_REQUIREMENTS.specialChars
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/-/g, "\\-");
    const specialRegex = new RegExp(`[${escapedChars}]`);
    if (!specialRegex.test(password)) {
      return "パスワードには特殊文字を含めてください";
    }
  }

  // Check for common weak passwords
  const commonPasswords = [
    "password123",
    "qwerty123",
    "12345678",
    "admin123",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return "このパスワードは一般的すぎます。別のパスワードを選択してください";
  }

  return null;
}

// ==================== Session Security ====================

/**
 * Session configuration for enhanced security
 */
export const SESSION_CONFIG = {
  // Maximum session age (24 hours)
  maxAge: 24 * 60 * 60,

  // Idle timeout (30 minutes of inactivity)
  idleTimeout: 30 * 60,

  // Require re-authentication for sensitive operations after (15 minutes)
  sensitiveOperationTimeout: 15 * 60,
};

// ==================== Audit Logging ====================

export type AuditAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "ACCESS_DENIED"
  | "PHI_ACCESS"
  | "EXPORT"
  | "PRINT";

export interface AuditLogEntry {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId?: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  oldData?: unknown;
  newData?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Entities that contain PHI and require audit logging
 */
export const PHI_ENTITIES = new Set([
  "Patient",
  "MedicalRecord",
  "Prescription",
  "LabResult",
  "MedicalImage",
  "AudiometryTest",
  "TympanometryTest",
  "VestibularTest",
  "EndoscopyExam",
  "AllergyTest",
  "QuestionnaireResponse",
  "Document",
  "PatientMessage",
  "MedicationRecord",
]);

/**
 * Check if an entity type is PHI
 */
export function isPhiEntity(entityType: string): boolean {
  return PHI_ENTITIES.has(entityType);
}

// ==================== Error Handling ====================

/**
 * Sanitize error messages for client response
 * Prevents information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  // In development, show more details
  if (process.env.NODE_ENV === "development") {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // In production, return generic messages
  return "エラーが発生しました";
}

/**
 * Safe error logging that doesn't expose sensitive data
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>
): void {
  // Filter out sensitive fields
  const sensitiveFields = [
    "password",
    "passwordHash",
    "token",
    "secret",
    "apiKey",
  ];
  const sanitizedDetails: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitizedDetails[key] = "[REDACTED]";
    } else {
      sanitizedDetails[key] = value;
    }
  }

  // In production, this would go to a secure logging service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to secure logging service (e.g., AWS CloudWatch, Datadog)
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event,
        ...sanitizedDetails,
      })
    );
  } else {
    console.log(`[SECURITY] ${event}:`, sanitizedDetails);
  }
}
