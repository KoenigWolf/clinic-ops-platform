import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock prisma
const mockPrisma = {
  patient: {
    findFirst: vi.fn(),
  },
  audiometryTest: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  tympanometryTest: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  vestibularTest: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  endoscopyExam: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  allergyTest: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  entDiagnosisTemplate: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

describe("entRouter", () => {
  const mockTenantId = "test-tenant-id";
  const mockPatientId = "test-patient-id";
  const mockDoctorSession = {
    user: {
      id: "test-doctor-id",
      email: "doctor@example.com",
      name: "Test Doctor",
      role: "DOCTOR",
      tenantId: mockTenantId,
    },
    expires: "2025-01-01",
  };
  const mockStaffSession = {
    user: {
      id: "test-staff-id",
      email: "staff@example.com",
      name: "Test Staff",
      role: "STAFF",
      tenantId: mockTenantId,
    },
    expires: "2025-01-01",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockPrisma.patient.findFirst.mockResolvedValue({ id: mockPatientId, tenantId: mockTenantId });
    mockPrisma.audiometryTest.count.mockResolvedValue(0);
    mockPrisma.audiometryTest.findMany.mockResolvedValue([]);
    mockPrisma.tympanometryTest.count.mockResolvedValue(0);
    mockPrisma.tympanometryTest.findMany.mockResolvedValue([]);
    mockPrisma.vestibularTest.count.mockResolvedValue(0);
    mockPrisma.vestibularTest.findMany.mockResolvedValue([]);
    mockPrisma.endoscopyExam.count.mockResolvedValue(0);
    mockPrisma.endoscopyExam.findMany.mockResolvedValue([]);
    mockPrisma.allergyTest.count.mockResolvedValue(0);
    mockPrisma.allergyTest.findMany.mockResolvedValue([]);
    mockPrisma.entDiagnosisTemplate.findMany.mockResolvedValue([]);
  });

  describe("stats", () => {
    it("全検査タイプの統計を返す", async () => {
      mockPrisma.audiometryTest.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);
      mockPrisma.tympanometryTest.count.mockResolvedValueOnce(8).mockResolvedValueOnce(2);
      mockPrisma.vestibularTest.count.mockResolvedValueOnce(5).mockResolvedValueOnce(1);
      mockPrisma.endoscopyExam.count.mockResolvedValueOnce(15).mockResolvedValueOnce(5);
      mockPrisma.allergyTest.count.mockResolvedValueOnce(12).mockResolvedValueOnce(4);

      const { entRouter } = await import("./ent");

      const caller = entRouter.createCaller({
        prisma: mockPrisma,
        session: mockStaffSession,
        tenantId: mockTenantId,
      } as never);

      const result = await caller.stats();

      expect(result.totals).toEqual({
        audiometry: 10,
        tympanometry: 8,
        vestibular: 5,
        endoscopy: 15,
        allergy: 12,
        total: 50,
      });
      expect(result.recent).toEqual({
        audiometry: 3,
        tympanometry: 2,
        vestibular: 1,
        endoscopy: 5,
        allergy: 4,
        total: 15,
      });
    });

    it("tenantIdでフィルタされる", async () => {
      const { entRouter } = await import("./ent");

      const caller = entRouter.createCaller({
        prisma: mockPrisma,
        session: mockStaffSession,
        tenantId: mockTenantId,
      } as never);

      await caller.stats();

      expect(mockPrisma.audiometryTest.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patient: { tenantId: mockTenantId },
          }),
        })
      );
    });
  });

  describe("audiometry", () => {
    describe("list", () => {
      it("患者の聴力検査一覧を返す", async () => {
        const mockTests = [
          { id: "test1", patientId: mockPatientId, testDate: new Date(), testType: "PURE_TONE" },
          { id: "test2", patientId: mockPatientId, testDate: new Date(), testType: "PURE_TONE" },
        ];
        mockPrisma.audiometryTest.findMany.mockResolvedValue(mockTests);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockStaffSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.audiometry.list({ patientId: mockPatientId });

        expect(result).toEqual(mockTests);
        expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith({
          where: { id: mockPatientId, tenantId: mockTenantId },
        });
      });

      it("患者が見つからない場合はNOT_FOUNDエラー", async () => {
        mockPrisma.patient.findFirst.mockResolvedValue(null);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockStaffSession,
          tenantId: mockTenantId,
        } as never);

        await expect(caller.audiometry.list({ patientId: mockPatientId }))
          .rejects.toThrow(TRPCError);
      });
    });

    describe("create", () => {
      it("医師が聴力検査を作成できる", async () => {
        const mockTest = {
          id: "new-test",
          patientId: mockPatientId,
          testType: "PURE_TONE",
          rightAir1000: 25,
          leftAir1000: 30,
        };
        mockPrisma.audiometryTest.create.mockResolvedValue(mockTest);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.audiometry.create({
          patientId: mockPatientId,
          testType: "PURE_TONE",
          rightAir1000: 25,
          leftAir1000: 30,
        });

        expect(result).toEqual(mockTest);
      });

      it("患者が別テナントの場合はNOT_FOUNDエラー", async () => {
        mockPrisma.patient.findFirst.mockResolvedValue(null);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        await expect(caller.audiometry.create({
          patientId: "other-patient",
          testType: "PURE_TONE",
        })).rejects.toThrow(TRPCError);
      });
    });

    describe("update", () => {
      it("医師が聴力検査を更新できる", async () => {
        const existingTest = {
          id: "test1",
          patientId: mockPatientId,
          patient: { tenantId: mockTenantId },
          interpretation: "Normal hearing",
        };
        mockPrisma.audiometryTest.findFirst.mockResolvedValue(existingTest);
        mockPrisma.audiometryTest.update.mockResolvedValue({
          ...existingTest,
          interpretation: "Updated interpretation",
        });

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.audiometry.update({
          id: "test1",
          data: { interpretation: "Updated interpretation" },
        });

        expect(result.interpretation).toBe("Updated interpretation");
      });

      it("別テナントのテストは更新できない", async () => {
        mockPrisma.audiometryTest.findFirst.mockResolvedValue({
          id: "test1",
          patient: { tenantId: "other-tenant" },
        });

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        await expect(caller.audiometry.update({
          id: "test1",
          data: { interpretation: "Updated" },
        })).rejects.toThrow(TRPCError);
      });
    });

    describe("delete", () => {
      it("医師が聴力検査を削除できる", async () => {
        mockPrisma.audiometryTest.findFirst.mockResolvedValue({
          id: "test1",
          patient: { tenantId: mockTenantId },
        });
        mockPrisma.audiometryTest.delete.mockResolvedValue({ id: "test1" });

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        await caller.audiometry.delete({ id: "test1" });

        expect(mockPrisma.audiometryTest.delete).toHaveBeenCalledWith({
          where: { id: "test1" },
        });
      });
    });
  });

  describe("tympanometry", () => {
    describe("list", () => {
      it("患者のティンパノメトリー一覧を返す", async () => {
        const mockTests = [
          { id: "test1", patientId: mockPatientId, rightType: "A", leftType: "A" },
        ];
        mockPrisma.tympanometryTest.findMany.mockResolvedValue(mockTests);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockStaffSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.tympanometry.list({ patientId: mockPatientId });

        expect(result).toEqual(mockTests);
      });
    });

    describe("create", () => {
      it("医師がティンパノメトリーを作成できる", async () => {
        const mockTest = {
          id: "new-test",
          patientId: mockPatientId,
          rightType: "A",
          rightPeakPressure: 0,
          rightCompliance: 0.5,
        };
        mockPrisma.tympanometryTest.create.mockResolvedValue(mockTest);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.tympanometry.create({
          patientId: mockPatientId,
          rightType: "A",
          rightPeakPressure: 0,
          rightCompliance: 0.5,
        });

        expect(result).toEqual(mockTest);
      });
    });
  });

  describe("vestibular", () => {
    describe("list", () => {
      it("患者の平衡機能検査一覧を返す", async () => {
        const mockTests = [
          { id: "test1", patientId: mockPatientId, testType: "CALORIC", chiefComplaint: "めまい" },
        ];
        mockPrisma.vestibularTest.findMany.mockResolvedValue(mockTests);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockStaffSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.vestibular.list({ patientId: mockPatientId });

        expect(result).toEqual(mockTests);
      });
    });
  });

  describe("endoscopy", () => {
    describe("list", () => {
      it("患者の内視鏡検査一覧を返す", async () => {
        const mockExams = [
          { id: "exam1", patientId: mockPatientId, examType: "NASAL", nasalFindings: "正常" },
        ];
        mockPrisma.endoscopyExam.findMany.mockResolvedValue(mockExams);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockStaffSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.endoscopy.list({ patientId: mockPatientId });

        expect(result).toEqual(mockExams);
      });
    });

    describe("create", () => {
      it("医師が内視鏡検査を作成できる", async () => {
        const mockExam = {
          id: "new-exam",
          patientId: mockPatientId,
          examType: "NASAL",
          nasalFindings: "粘膜正常",
          imageUrls: [],
        };
        mockPrisma.endoscopyExam.create.mockResolvedValue(mockExam);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.endoscopy.create({
          patientId: mockPatientId,
          examType: "NASAL",
          nasalFindings: "粘膜正常",
        });

        expect(result).toEqual(mockExam);
      });
    });
  });

  describe("allergy", () => {
    describe("list", () => {
      it("患者のアレルギー検査一覧を返す", async () => {
        const mockTests = [
          { id: "test1", patientId: mockPatientId, testType: "RAST", totalIgE: 100 },
        ];
        mockPrisma.allergyTest.findMany.mockResolvedValue(mockTests);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockStaffSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.allergy.list({ patientId: mockPatientId });

        expect(result).toEqual(mockTests);
      });
    });

    describe("create", () => {
      it("医師がアレルギー検査を作成できる", async () => {
        const mockTest = {
          id: "new-test",
          patientId: mockPatientId,
          testType: "RAST",
          totalIgE: 150,
          results: { "スギ": "3", "ヒノキ": "2" },
        };
        mockPrisma.allergyTest.create.mockResolvedValue(mockTest);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.allergy.create({
          patientId: mockPatientId,
          testType: "RAST",
          totalIgE: 150,
          results: { "スギ": "3", "ヒノキ": "2" },
        });

        expect(result).toEqual(mockTest);
      });
    });
  });

  describe("template", () => {
    describe("list", () => {
      it("テンプレート一覧を返す", async () => {
        const mockTemplates = [
          { id: "t1", name: "急性中耳炎", category: "EAR", isActive: true },
          { id: "t2", name: "アレルギー性鼻炎", category: "NOSE", isActive: true },
        ];
        mockPrisma.entDiagnosisTemplate.findMany.mockResolvedValue(mockTemplates);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockStaffSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.template.list();

        expect(result).toEqual(mockTemplates);
      });

      it("カテゴリでフィルタできる", async () => {
        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockStaffSession,
          tenantId: mockTenantId,
        } as never);

        await caller.template.list({ category: "EAR" });

        expect(mockPrisma.entDiagnosisTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              tenantId: mockTenantId,
              isActive: true,
              category: "EAR",
            }),
          })
        );
      });
    });

    describe("create", () => {
      it("医師がテンプレートを作成できる", async () => {
        const mockTemplate = {
          id: "new-template",
          name: "急性中耳炎",
          category: "EAR",
          tenantId: mockTenantId,
          isActive: true,
        };
        mockPrisma.entDiagnosisTemplate.create.mockResolvedValue(mockTemplate);

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.template.create({
          name: "急性中耳炎",
          category: "EAR",
        });

        expect(result.name).toBe("急性中耳炎");
      });
    });

    describe("delete", () => {
      it("医師がテンプレートを論理削除できる", async () => {
        mockPrisma.entDiagnosisTemplate.findFirst.mockResolvedValue({
          id: "t1",
          tenantId: mockTenantId,
          isActive: true,
        });
        mockPrisma.entDiagnosisTemplate.update.mockResolvedValue({
          id: "t1",
          isActive: false,
        });

        const { entRouter } = await import("./ent");

        const caller = entRouter.createCaller({
          prisma: mockPrisma,
          session: mockDoctorSession,
          tenantId: mockTenantId,
        } as never);

        await caller.template.delete({ id: "t1" });

        expect(mockPrisma.entDiagnosisTemplate.update).toHaveBeenCalledWith({
          where: { id: "t1" },
          data: { isActive: false },
        });
      });
    });
  });

  describe("hearingLevelDistribution", () => {
    it("聴力レベル分布を計算する", async () => {
      mockPrisma.audiometryTest.findMany.mockResolvedValue([
        { rightAir500: 20, rightAir1000: 20, rightAir2000: 20, rightAir4000: 20,
          leftAir500: 20, leftAir1000: 20, leftAir2000: 20, leftAir4000: 20 }, // normal
        { rightAir500: 35, rightAir1000: 35, rightAir2000: 35, rightAir4000: 35,
          leftAir500: 45, leftAir1000: 45, leftAir2000: 45, leftAir4000: 45 }, // mild right, moderate left
      ]);

      const { entRouter } = await import("./ent");

      const caller = entRouter.createCaller({
        prisma: mockPrisma,
        session: mockStaffSession,
        tenantId: mockTenantId,
      } as never);

      const result = await caller.hearingLevelDistribution();

      expect(result.normal).toBeGreaterThanOrEqual(2);
      expect(result.mild).toBeGreaterThanOrEqual(1);
    });
  });
});
