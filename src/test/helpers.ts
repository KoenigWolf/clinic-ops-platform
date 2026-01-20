import { vi } from "vitest";
import type { Session } from "next-auth";

// Mock Prisma client
export const createMockPrisma = () => ({
  patient: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  appointment: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  prescription: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  invoice: {
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  medicalRecord: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  videoSession: {
    count: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
});

export type MockPrisma = ReturnType<typeof createMockPrisma>;

// Create authenticated session
export const createMockSession = (overrides?: Partial<Session["user"]>): Session => ({
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "DOCTOR" as const,
    tenantId: "test-tenant-id",
    ...overrides,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

// Create session without tenantId (precondition violation)
export const createSessionWithoutTenantId = (): Session => ({
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "DOCTOR" as const,
    tenantId: undefined as unknown as string,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});
