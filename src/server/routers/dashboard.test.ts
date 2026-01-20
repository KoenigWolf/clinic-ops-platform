import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const mockPrisma = {
  patient: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
  appointment: {
    findMany: vi.fn(),
  },
  prescription: {
    count: vi.fn(),
  },
  invoice: {
    aggregate: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

describe("dashboardRouter", () => {
  const mockTenantId = "test-tenant-id";
  const mockSession = {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      role: "DOCTOR",
      tenantId: mockTenantId,
    },
    expires: "2025-01-01",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockPrisma.patient.count.mockResolvedValue(0);
    mockPrisma.patient.findMany.mockResolvedValue([]);
    mockPrisma.appointment.findMany.mockResolvedValue([]);
    mockPrisma.prescription.count.mockResolvedValue(0);
    mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { total: null } });
  });

  describe("get", () => {
    it("全データを正しい構造で返す", async () => {
      // Setup mocks
      mockPrisma.patient.count.mockResolvedValue(100);
      mockPrisma.patient.findMany.mockResolvedValue([
        { id: "p1", patientNumber: "001", lastName: "山田", firstName: "太郎", updatedAt: new Date() },
      ]);
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          id: "a1",
          startTime: new Date(),
          endTime: new Date(),
          status: "SCHEDULED",
          isOnline: false,
          patient: { lastName: "山田", firstName: "太郎" },
        },
      ]);
      mockPrisma.prescription.count.mockResolvedValue(5);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { total: 150000 } });

      const { dashboardRouter } = await import("./dashboard");

      const caller = dashboardRouter.createCaller({
        prisma: mockPrisma,
        session: mockSession,
        tenantId: mockTenantId,
      } as never);

      const result = await caller.get();

      expect(result).toEqual({
        totalPatients: 100,
        recentPatients: [
          { id: "p1", patientNumber: "001", lastName: "山田", firstName: "太郎", updatedAt: expect.any(Date) },
        ],
        todayAppointments: [
          {
            id: "a1",
            startTime: expect.any(Date),
            endTime: expect.any(Date),
            status: "SCHEDULED",
            isOnline: false,
            patient: { lastName: "山田", firstName: "太郎" },
          },
        ],
        pendingPrescriptions: 5,
        monthlyRevenue: 150000,
      });
    });

    it("売上がnullの場合は0を返す", async () => {
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { total: null } });

      const { dashboardRouter } = await import("./dashboard");

      const caller = dashboardRouter.createCaller({
        prisma: mockPrisma,
        session: mockSession,
        tenantId: mockTenantId,
      } as never);

      const result = await caller.get();

      expect(result.monthlyRevenue).toBe(0);
    });

    it("データが空の場合でも正常に返す（正常な状態）", async () => {
      mockPrisma.patient.count.mockResolvedValue(0);
      mockPrisma.patient.findMany.mockResolvedValue([]);
      mockPrisma.appointment.findMany.mockResolvedValue([]);
      mockPrisma.prescription.count.mockResolvedValue(0);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { total: null } });

      const { dashboardRouter } = await import("./dashboard");

      const caller = dashboardRouter.createCaller({
        prisma: mockPrisma,
        session: mockSession,
        tenantId: mockTenantId,
      } as never);

      const result = await caller.get();

      expect(result).toEqual({
        totalPatients: 0,
        recentPatients: [],
        todayAppointments: [],
        pendingPrescriptions: 0,
        monthlyRevenue: 0,
      });
    });

    it("tenantIdでフィルタされている", async () => {
      const { dashboardRouter } = await import("./dashboard");

      const caller = dashboardRouter.createCaller({
        prisma: mockPrisma,
        session: mockSession,
        tenantId: mockTenantId,
      } as never);

      await caller.get();

      // patient.count がtenantIdでフィルタされていることを確認
      expect(mockPrisma.patient.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        })
      );

      // patient.findMany がtenantIdでフィルタされていることを確認
      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        })
      );

      // appointment.findMany がtenantIdでフィルタされていることを確認
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: mockTenantId }),
        })
      );
    });

    it("Promise.allで並列実行されている（パフォーマンス）", async () => {
      // 各クエリに遅延を追加
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      mockPrisma.patient.count.mockImplementation(async () => {
        await delay(50);
        return 10;
      });
      mockPrisma.patient.findMany.mockImplementation(async () => {
        await delay(50);
        return [];
      });
      mockPrisma.appointment.findMany.mockImplementation(async () => {
        await delay(50);
        return [];
      });
      mockPrisma.prescription.count.mockImplementation(async () => {
        await delay(50);
        return 0;
      });
      mockPrisma.invoice.aggregate.mockImplementation(async () => {
        await delay(50);
        return { _sum: { total: null } };
      });

      const { dashboardRouter } = await import("./dashboard");

      const caller = dashboardRouter.createCaller({
        prisma: mockPrisma,
        session: mockSession,
        tenantId: mockTenantId,
      } as never);

      const startTime = Date.now();
      await caller.get();
      const endTime = Date.now();

      // 5クエリ × 50ms = 250ms (直列) だが、並列なら ~50ms
      // 余裕を持って 150ms 以下を確認
      expect(endTime - startTime).toBeLessThan(150);
    });
  });
});
