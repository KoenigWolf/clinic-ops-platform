import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock prisma before importing trpc
vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

// Mock auth module
const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  getSession: () => mockGetSession(),
}));

describe("tRPC Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("protectedProcedure", () => {
    it("セッションがない場合UNAUTHORIZEDエラーを投げる", async () => {
      mockGetSession.mockResolvedValue(null);

      const { protectedProcedure, router } = await import("./trpc");

      const testRouter = router({
        test: protectedProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: null,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      await expect(caller.test()).rejects.toThrow(TRPCError);
      await expect(caller.test()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("セッションのuserがない場合UNAUTHORIZEDエラーを投げる", async () => {
      mockGetSession.mockResolvedValue({ expires: "2025-01-01" });

      const { protectedProcedure, router } = await import("./trpc");

      const testRouter = router({
        test: protectedProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: { expires: "2025-01-01" } as never,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      await expect(caller.test()).rejects.toThrow(TRPCError);
      await expect(caller.test()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("tenantIdがない場合INTERNAL_SERVER_ERRORを投げる（前提違反）", async () => {
      const sessionWithoutTenantId = {
        user: {
          id: "test-id",
          email: "test@example.com",
          name: "Test",
          role: "DOCTOR",
          tenantId: undefined,
        },
        expires: "2025-01-01",
      };
      mockGetSession.mockResolvedValue(sessionWithoutTenantId);

      const { protectedProcedure, router } = await import("./trpc");

      const testRouter = router({
        test: protectedProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: sessionWithoutTenantId as never,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      await expect(caller.test()).rejects.toThrow(TRPCError);
      await expect(caller.test()).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "認証済みユーザーにtenantIdがありません",
      });
    });

    it("正常なセッションの場合contextにtenantIdが設定される", async () => {
      const validSession = {
        user: {
          id: "test-id",
          email: "test@example.com",
          name: "Test",
          role: "DOCTOR",
          tenantId: "tenant-123",
        },
        expires: "2025-01-01",
      };
      mockGetSession.mockResolvedValue(validSession);

      const { protectedProcedure, router } = await import("./trpc");

      let capturedTenantId: string | undefined;
      const testRouter = router({
        test: protectedProcedure.query(({ ctx }) => {
          capturedTenantId = ctx.tenantId;
          return "success";
        }),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: validSession as never,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      const result = await caller.test();
      expect(result).toBe("success");
      expect(capturedTenantId).toBe("tenant-123");
    });
  });

  describe("adminProcedure", () => {
    it("roleがADMINでない場合FORBIDDENエラーを投げる", async () => {
      const doctorSession = {
        user: {
          id: "test-id",
          email: "test@example.com",
          name: "Test",
          role: "DOCTOR",
          tenantId: "tenant-123",
        },
        expires: "2025-01-01",
      };
      mockGetSession.mockResolvedValue(doctorSession);

      const { adminProcedure, router } = await import("./trpc");

      const testRouter = router({
        test: adminProcedure.query(() => "success"),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: doctorSession as never,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      await expect(caller.test()).rejects.toThrow(TRPCError);
      await expect(caller.test()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("ADMINロールの場合成功する", async () => {
      const adminSession = {
        user: {
          id: "test-id",
          email: "test@example.com",
          name: "Admin",
          role: "ADMIN",
          tenantId: "tenant-123",
        },
        expires: "2025-01-01",
      };
      mockGetSession.mockResolvedValue(adminSession);

      const { adminProcedure, router } = await import("./trpc");

      const testRouter = router({
        test: adminProcedure.query(() => "admin-only"),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: adminSession as never,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      const result = await caller.test();
      expect(result).toBe("admin-only");
    });
  });

  describe("doctorProcedure", () => {
    it("ADMIN roleで成功する", async () => {
      const adminSession = {
        user: {
          id: "test-id",
          email: "test@example.com",
          name: "Admin",
          role: "ADMIN",
          tenantId: "tenant-123",
        },
        expires: "2025-01-01",
      };
      mockGetSession.mockResolvedValue(adminSession);

      const { doctorProcedure, router } = await import("./trpc");

      const testRouter = router({
        test: doctorProcedure.query(() => "doctor-access"),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: adminSession as never,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      const result = await caller.test();
      expect(result).toBe("doctor-access");
    });

    it("DOCTOR roleで成功する", async () => {
      const doctorSession = {
        user: {
          id: "test-id",
          email: "test@example.com",
          name: "Doctor",
          role: "DOCTOR",
          tenantId: "tenant-123",
        },
        expires: "2025-01-01",
      };
      mockGetSession.mockResolvedValue(doctorSession);

      const { doctorProcedure, router } = await import("./trpc");

      const testRouter = router({
        test: doctorProcedure.query(() => "doctor-access"),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: doctorSession as never,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      const result = await caller.test();
      expect(result).toBe("doctor-access");
    });

    it("STAFF roleの場合FORBIDDENエラーを投げる", async () => {
      const staffSession = {
        user: {
          id: "test-id",
          email: "test@example.com",
          name: "Staff",
          role: "STAFF",
          tenantId: "tenant-123",
        },
        expires: "2025-01-01",
      };
      mockGetSession.mockResolvedValue(staffSession);

      const { doctorProcedure, router } = await import("./trpc");

      const testRouter = router({
        test: doctorProcedure.query(() => "doctor-access"),
      });

      const caller = testRouter.createCaller({
        prisma: {} as never,
        session: staffSession as never,
        requestMeta: { ipAddress: undefined, userAgent: undefined },
      });

      await expect(caller.test()).rejects.toThrow(TRPCError);
      await expect(caller.test()).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });
});
