import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/lib/trpc";
import superjson from "superjson";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function createTestWrapper(session: Session | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:3000/api/trpc",
        transformer: superjson,
      }),
    ],
  });

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <SessionProvider session={session}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </trpc.Provider>
      </SessionProvider>
    );
  };
}

// Default session for tests
export const defaultTestSession: Session = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "DOCTOR",
    tenantId: "test-tenant-id",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
