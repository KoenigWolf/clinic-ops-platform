import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// Mock prisma
const mockPrisma = {
  patient: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  appointment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  medicalRecord: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  prescription: {
    findMany: vi.fn(),
  },
  medicationRecord: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  patientMessage: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  patientNotification: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  labResult: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

describe("portalRouter", () => {
  const mockTenantId = "test-tenant-id";
  const mockPatientId = "test-patient-id";
  const mockPatientSession = {
    user: {
      id: "test-user-id",
      email: "patient@example.com",
      name: "Test Patient",
      role: "PATIENT",
      tenantId: mockTenantId,
      patientId: mockPatientId,
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

  const mockPatient = {
    id: mockPatientId,
    tenantId: mockTenantId,
    firstName: "太郎",
    lastName: "山田",
    email: "patient@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
    mockPrisma.patient.findUnique.mockResolvedValue(mockPatient);
    mockPrisma.appointment.findMany.mockResolvedValue([]);
    mockPrisma.medicalRecord.findMany.mockResolvedValue([]);
    mockPrisma.prescription.findMany.mockResolvedValue([]);
    mockPrisma.medicationRecord.findMany.mockResolvedValue([]);
    mockPrisma.patientMessage.findMany.mockResolvedValue([]);
    mockPrisma.patientMessage.count.mockResolvedValue(0);
    mockPrisma.patientNotification.findMany.mockResolvedValue([]);
    mockPrisma.patientNotification.count.mockResolvedValue(0);
  });

  describe("Patient-facing APIs", () => {
    describe("myAppointments", () => {
      it("自分の予約一覧を返す", async () => {
        const mockAppointments = [
          {
            id: "apt1",
            patientId: mockPatientId,
            appointmentDate: new Date(),
            status: "SCHEDULED",
            doctor: { name: "山田医師" },
          },
        ];
        mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments);

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.myAppointments();

        expect(result).toEqual(mockAppointments);
      });

      it("患者が見つからない場合は空配列を返す", async () => {
        mockPrisma.patient.findFirst.mockResolvedValue(null);

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.myAppointments();

        expect(result).toEqual([]);
      });
    });

    describe("myMedications", () => {
      it("自分の服薬記録一覧を返す", async () => {
        const mockMedications = [
          {
            id: "med1",
            patientId: mockPatientId,
            medicationName: "アスピリン",
            dosage: "100mg",
          },
        ];
        mockPrisma.medicationRecord.findMany.mockResolvedValue(mockMedications);

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.myMedications();

        expect(result).toEqual(mockMedications);
      });
    });

    describe("addMyMedication", () => {
      it("患者が自分の服薬記録を作成できる", async () => {
        const mockMedication = {
          id: "new-med",
          patientId: mockPatientId,
          medicationName: "風邪薬",
          dosage: "1錠",
          frequency: "1日3回",
          type: "OTC",
        };
        mockPrisma.medicationRecord.create.mockResolvedValue(mockMedication);

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.addMyMedication({
          name: "風邪薬",
          dosage: "1錠",
          frequency: "1日3回",
          type: "OTC",
          startDate: new Date(),
        });

        expect(result).toEqual(mockMedication);
      });
    });

    describe("updateMyMedication", () => {
      it("自分の服薬記録を更新できる", async () => {
        const existingMedication = {
          id: "med1",
          patientId: mockPatientId,
          patient: { tenantId: mockTenantId },
          medicationName: "アスピリン",
        };
        mockPrisma.medicationRecord.findFirst.mockResolvedValue(existingMedication);
        mockPrisma.medicationRecord.update.mockResolvedValue({
          ...existingMedication,
          notes: "食後に服用",
        });

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.updateMyMedication({
          id: "med1",
          data: { notes: "食後に服用" },
        });

        expect(result.notes).toBe("食後に服用");
      });

      it("他テナントの服薬記録は更新できない", async () => {
        mockPrisma.medicationRecord.findFirst.mockResolvedValue({
          id: "med1",
          patientId: "other-patient",
          patient: { tenantId: "other-tenant" },
        });

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        await expect(caller.updateMyMedication({
          id: "med1",
          data: { notes: "更新" },
        })).rejects.toThrow(TRPCError);
      });
    });

    describe("deleteMyMedication", () => {
      it("自分の服薬記録を削除できる", async () => {
        mockPrisma.medicationRecord.findFirst.mockResolvedValue({
          id: "med1",
          patientId: mockPatientId,
          patient: { tenantId: mockTenantId },
        });
        mockPrisma.medicationRecord.delete.mockResolvedValue({ id: "med1" });

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        await caller.deleteMyMedication({ id: "med1" });

        expect(mockPrisma.medicationRecord.delete).toHaveBeenCalledWith({
          where: { id: "med1" },
        });
      });

      it("他テナントの服薬記録は削除できない", async () => {
        mockPrisma.medicationRecord.findFirst.mockResolvedValue({
          id: "med1",
          patientId: "other-patient",
          patient: { tenantId: "other-tenant" },
        });

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        await expect(caller.deleteMyMedication({ id: "med1" }))
          .rejects.toThrow(TRPCError);
      });
    });

    describe("markMyNotificationAsRead", () => {
      it("自分の通知を既読にできる", async () => {
        mockPrisma.patientNotification.findFirst.mockResolvedValue({
          id: "notif1",
          patientId: mockPatientId,
          patient: { tenantId: mockTenantId },
          isRead: false,
        });
        mockPrisma.patientNotification.update.mockResolvedValue({
          id: "notif1",
          isRead: true,
        });

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        const result = await caller.markMyNotificationAsRead({ id: "notif1" });

        expect(result.isRead).toBe(true);
      });

      it("他テナントの通知は既読にできない", async () => {
        mockPrisma.patientNotification.findFirst.mockResolvedValue({
          id: "notif1",
          patientId: "other-patient",
          patient: { tenantId: "other-tenant" },
        });

        const { portalRouter } = await import("./portal");

        const caller = portalRouter.createCaller({
          prisma: mockPrisma,
          session: mockPatientSession,
          tenantId: mockTenantId,
        } as never);

        await expect(caller.markMyNotificationAsRead({ id: "notif1" }))
          .rejects.toThrow(TRPCError);
      });
    });
  });

  describe("Staff-facing APIs", () => {
    describe("message", () => {
      describe("list", () => {
        it("患者のメッセージ一覧を返す", async () => {
          const mockMessages = [
            { id: "msg1", patientId: mockPatientId, subject: "診察結果", isRead: false },
          ];
          mockPrisma.patientMessage.findMany.mockResolvedValue(mockMessages);

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.message.list({ patientId: mockPatientId });

          expect(result).toEqual(mockMessages);
        });

        it("患者が見つからない場合はNOT_FOUNDエラー", async () => {
          mockPrisma.patient.findFirst.mockResolvedValue(null);

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          await expect(caller.message.list({ patientId: mockPatientId }))
            .rejects.toThrow(TRPCError);
        });
      });

      describe("markAsRead", () => {
        it("メッセージを既読にできる", async () => {
          mockPrisma.patientMessage.findFirst.mockResolvedValue({
            id: "msg1",
            patientId: mockPatientId,
            patient: { tenantId: mockTenantId },
            isRead: false,
          });
          mockPrisma.patientMessage.update.mockResolvedValue({
            id: "msg1",
            isRead: true,
          });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.message.markAsRead({ messageId: "msg1" });

          expect(result.isRead).toBe(true);
        });

        it("他テナントのメッセージは既読にできない", async () => {
          mockPrisma.patientMessage.findFirst.mockResolvedValue({
            id: "msg1",
            patientId: "other-patient",
            patient: { tenantId: "other-tenant" },
          });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          await expect(caller.message.markAsRead({ messageId: "msg1" }))
            .rejects.toThrow(TRPCError);
        });
      });

      describe("unreadCount", () => {
        it("未読メッセージ数を返す", async () => {
          mockPrisma.patientMessage.count.mockResolvedValue(5);

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.message.unreadCount({ patientId: mockPatientId });

          expect(result).toBe(5);
        });
      });
    });

    describe("notification", () => {
      describe("list", () => {
        it("患者の通知一覧を返す", async () => {
          const mockNotifications = [
            { id: "notif1", patientId: mockPatientId, title: "予約確認", isRead: false },
          ];
          mockPrisma.patientNotification.findMany.mockResolvedValue(mockNotifications);

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.notification.list({ patientId: mockPatientId });

          expect(result).toEqual(mockNotifications);
        });
      });

      describe("markAsRead", () => {
        it("通知を既読にできる", async () => {
          mockPrisma.patientNotification.findFirst.mockResolvedValue({
            id: "notif1",
            patientId: mockPatientId,
            patient: { tenantId: mockTenantId },
            isRead: false,
          });
          mockPrisma.patientNotification.update.mockResolvedValue({
            id: "notif1",
            isRead: true,
          });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.notification.markAsRead({ notificationId: "notif1" });

          expect(result.isRead).toBe(true);
        });

        it("他テナントの通知は既読にできない", async () => {
          mockPrisma.patientNotification.findFirst.mockResolvedValue({
            id: "notif1",
            patientId: "other-patient",
            patient: { tenantId: "other-tenant" },
          });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          await expect(caller.notification.markAsRead({ notificationId: "notif1" }))
            .rejects.toThrow(TRPCError);
        });
      });

      describe("markAllAsRead", () => {
        it("全通知を既読にできる", async () => {
          mockPrisma.patientNotification.updateMany.mockResolvedValue({ count: 3 });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.notification.markAllAsRead({ patientId: mockPatientId });

          expect(result.count).toBe(3);
        });

        it("患者が見つからない場合はNOT_FOUNDエラー", async () => {
          mockPrisma.patient.findFirst.mockResolvedValue(null);

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          await expect(caller.notification.markAllAsRead({ patientId: mockPatientId }))
            .rejects.toThrow(TRPCError);
        });
      });

      describe("unreadCount", () => {
        it("未読通知数を返す", async () => {
          mockPrisma.patientNotification.count.mockResolvedValue(3);

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.notification.unreadCount({ patientId: mockPatientId });

          expect(result).toBe(3);
        });
      });
    });

    describe("medication", () => {
      describe("list", () => {
        it("患者の服薬一覧を返す", async () => {
          const mockMedications = [
            { id: "med1", patientId: mockPatientId, medicationName: "アスピリン" },
          ];
          mockPrisma.medicationRecord.findMany.mockResolvedValue(mockMedications);

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.medication.list({ patientId: mockPatientId });

          expect(result).toEqual(mockMedications);
        });
      });

      describe("update", () => {
        it("服薬記録を更新できる", async () => {
          mockPrisma.medicationRecord.findFirst.mockResolvedValue({
            id: "med1",
            patient: { tenantId: mockTenantId },
          });
          mockPrisma.medicationRecord.update.mockResolvedValue({
            id: "med1",
            notes: "更新後",
          });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          const result = await caller.medication.update({
            id: "med1",
            data: { notes: "更新後" },
          });

          expect(result.notes).toBe("更新後");
        });

        it("他テナントの服薬記録は更新できない", async () => {
          mockPrisma.medicationRecord.findFirst.mockResolvedValue({
            id: "med1",
            patient: { tenantId: "other-tenant" },
          });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          await expect(caller.medication.update({
            id: "med1",
            data: { notes: "更新" },
          })).rejects.toThrow(TRPCError);
        });
      });

      describe("delete", () => {
        it("服薬記録を削除できる", async () => {
          mockPrisma.medicationRecord.findFirst.mockResolvedValue({
            id: "med1",
            patient: { tenantId: mockTenantId },
          });
          mockPrisma.medicationRecord.delete.mockResolvedValue({ id: "med1" });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          await caller.medication.delete({ id: "med1" });

          expect(mockPrisma.medicationRecord.delete).toHaveBeenCalledWith({
            where: { id: "med1" },
          });
        });

        it("他テナントの服薬記録は削除できない", async () => {
          mockPrisma.medicationRecord.findFirst.mockResolvedValue({
            id: "med1",
            patient: { tenantId: "other-tenant" },
          });

          const { portalRouter } = await import("./portal");

          const caller = portalRouter.createCaller({
            prisma: mockPrisma,
            session: mockStaffSession,
            tenantId: mockTenantId,
          } as never);

          await expect(caller.medication.delete({ id: "med1" }))
            .rejects.toThrow(TRPCError);
        });
      });
    });
  });
});
