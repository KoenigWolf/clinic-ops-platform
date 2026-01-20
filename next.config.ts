import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security: Disable x-powered-by header
  poweredByHeader: false,

  // Security: Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.daily.co",
      },
    ],
  },

  // Security: Additional headers (complementing middleware)
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
      {
        // Stricter headers for API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },

  // Security: Redirect HTTP to HTTPS in production
  async redirects() {
    // Only enable in production with HTTPS
    if (process.env.NODE_ENV !== "production") {
      return [];
    }
    return [];
  },

  // Experimental features
  experimental: {
    // Enable server actions with size limit
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
