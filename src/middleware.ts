import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  applySecurityHeaders,
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  getClientIdentifier,
  rateLimitHeaders,
  generateCsrfToken,
  getCsrfCookieSettings,
  CSRF_COOKIE_NAME,
} from "@/lib/security";

const publicPaths = ["/login", "/register", "/api/auth"];

// Paths that require stricter rate limiting
const authPaths = ["/api/auth/callback", "/api/auth/signin", "/login"];
const uploadPaths = ["/api/upload"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const clientId = getClientIdentifier(req);

  // Apply rate limiting based on path type
  let rateLimitConfig = RATE_LIMIT_CONFIGS.api;
  if (authPaths.some((path) => pathname.startsWith(path))) {
    rateLimitConfig = RATE_LIMIT_CONFIGS.auth;
  } else if (uploadPaths.some((path) => pathname.startsWith(path))) {
    rateLimitConfig = RATE_LIMIT_CONFIGS.upload;
  }

  // Check rate limit
  const rateLimit = checkRateLimit(clientId, rateLimitConfig);
  if (!rateLimit.allowed) {
    const response = new NextResponse(
      JSON.stringify({ error: "リクエストが多すぎます。しばらくお待ちください。" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...rateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
        },
      }
    );
    return applySecurityHeaders(response);
  }

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next();
    // Add rate limit headers
    Object.entries(
      rateLimitHeaders(rateLimit.remaining, rateLimit.resetTime)
    ).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return applySecurityHeaders(response);
  }

  // Redirect to login if not authenticated
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${req.nextUrl.pathname}${req.nextUrl.search}`
    );
    const response = NextResponse.redirect(loginUrl);
    return applySecurityHeaders(response);
  }

  // Create response
  const response = NextResponse.next();

  // Apply security headers to all responses
  applySecurityHeaders(response);

  // Add rate limit headers
  Object.entries(
    rateLimitHeaders(rateLimit.remaining, rateLimit.resetTime)
  ).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Set CSRF token cookie if not present
  const existingCsrf = req.cookies.get(CSRF_COOKIE_NAME);
  if (!existingCsrf && !pathname.startsWith("/api/")) {
    const csrfToken = generateCsrfToken();
    response.headers.append("Set-Cookie", getCsrfCookieSettings(csrfToken));
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
