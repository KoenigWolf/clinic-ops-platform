import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const portalRouter = router({
  // ==================== 患者ポータル (自己参照) ====================

  // 自分のダッシュボード情報
  myDashboard: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) {
      return {
        patient: null,
        upcomingAppointments: 0,
        unreadMessages: 0,
        activeMedications: 0,
        unreadNotifications: 0,
        appointments: [],
        recentMessages: [],
        currentMedications: [],
        notifications: [],
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      appointments,
      recentMessages,
      currentMedications,
      notifications,
      unreadNotifications,
    ] = await Promise.all([
      ctx.prisma.appointment.findMany({
        where: {
          patientId: patient.id,
          appointmentDate: { gte: today },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        include: { doctor: { select: { name: true } } },
        orderBy: { appointmentDate: "asc" },
        take: 5,
      }),
      ctx.prisma.patientMessage.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      ctx.prisma.medicationRecord.findMany({
        where: {
          patientId: patient.id,
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
        orderBy: { startDate: "desc" },
      }),
      ctx.prisma.patientNotification.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      ctx.prisma.patientNotification.count({
        where: { patientId: patient.id, isRead: false },
      }),
    ]);

    const unreadMessages = await ctx.prisma.patientMessage.count({
      where: { patientId: patient.id, isRead: false, senderType: "STAFF" },
    });

    return {
      patient,
      upcomingAppointments: appointments.length,
      unreadMessages,
      activeMedications: currentMedications.length,
      unreadNotifications,
      appointments,
      recentMessages,
      currentMedications,
      notifications,
    };
  }),

  // 自分の予約一覧
  myAppointments: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) return [];

    return ctx.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { doctor: { select: { name: true } } },
      orderBy: { appointmentDate: "desc" },
    });
  }),

  // 自分のメッセージ一覧
  myMessages: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) return [];

    return ctx.prisma.patientMessage.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 自分のメッセージを送信
  sendMyMessage: protectedProcedure
    .input(z.object({ subject: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.email) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const patient = await ctx.prisma.patient.findFirst({
        where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "患者情報が見つかりません" });

      return ctx.prisma.patientMessage.create({
        data: {
          patientId: patient.id,
          subject: input.subject,
          content: input.content,
          senderType: "PATIENT",
          senderId: ctx.session.user.id,
        },
      });
    }),

  // 自分のメッセージを既読にする
  markMyMessageAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.patientMessage.update({
        where: { id: input.id },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  // 自分のお薬一覧
  myMedications: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) return [];

    return ctx.prisma.medicationRecord.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 自分の服用中のお薬
  myCurrentMedications: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) return [];

    const today = new Date();
    return ctx.prisma.medicationRecord.findMany({
      where: {
        patientId: patient.id,
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      orderBy: { startDate: "desc" },
    });
  }),

  // 自分のお薬を追加
  addMyMedication: protectedProcedure
    .input(z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      type: z.enum(["PRESCRIPTION", "OTC", "SUPPLEMENT"]),
      startDate: z.date(),
      endDate: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.email) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const patient = await ctx.prisma.patient.findFirst({
        where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "患者情報が見つかりません" });

      return ctx.prisma.medicationRecord.create({
        data: {
          patientId: patient.id,
          medicationName: input.name,
          dosage: input.dosage,
          frequency: input.frequency,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          notes: input.notes,
        },
      });
    }),

  // 自分のお薬を更新
  updateMyMedication: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        type: z.enum(["PRESCRIPTION", "OTC", "SUPPLEMENT"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // テナント検証
      const record = await ctx.prisma.medicationRecord.findFirst({
        where: { id: input.id },
        include: { patient: true },
      });
      if (!record || record.patient.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const { name, ...rest } = input.data;
      return ctx.prisma.medicationRecord.update({
        where: { id: input.id },
        data: {
          ...(name && { medicationName: name }),
          ...rest,
        },
      });
    }),

  // 自分のお薬を削除
  deleteMyMedication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // テナント検証
      const record = await ctx.prisma.medicationRecord.findFirst({
        where: { id: input.id },
        include: { patient: true },
      });
      if (!record || record.patient.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.medicationRecord.delete({
        where: { id: input.id },
      });
    }),

  // 自分の通知一覧
  myNotifications: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) return [];

    return ctx.prisma.patientNotification.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 自分の未読通知数
  myUnreadNotificationCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) return 0;

    return ctx.prisma.patientNotification.count({
      where: { patientId: patient.id, isRead: false },
    });
  }),

  // 自分の通知を既読にする
  markMyNotificationAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // テナント検証
      const notification = await ctx.prisma.patientNotification.findFirst({
        where: { id: input.id },
        include: { patient: true },
      });
      if (!notification || notification.patient.tenantId !== ctx.tenantId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.patientNotification.update({
        where: { id: input.id },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  // 自分の通知を全て既読にする
  markAllMyNotificationsAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) return { count: 0 };

    return ctx.prisma.patientNotification.updateMany({
      where: { patientId: patient.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }),

  // 自分の検査結果一覧
  myLabResults: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const patient = await ctx.prisma.patient.findFirst({
      where: { email: ctx.session.user.email, tenantId: ctx.tenantId },
    });
    if (!patient) return [];

    return ctx.prisma.labResult.findMany({
      where: { patientId: patient.id },
      orderBy: { testDate: "desc" },
    });
  }),

  // ==================== スタッフ用 患者ポータル ====================

  // メッセージ
  message: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.string(), limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.patientMessage.findMany({
          where: { patientId: input.patientId },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        });
      }),

    send: protectedProcedure
      .input(z.object({
        patientId: z.string(),
        content: z.string(),
        attachments: z.array(z.object({
          name: z.string(),
          url: z.string(),
          type: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.patientMessage.create({
          data: {
            patientId: input.patientId,
            content: input.content,
            senderType: "STAFF",
            senderId: ctx.session.user.id,
            attachments: input.attachments,
          },
        });
      }),

    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // テナント検証
        const message = await ctx.prisma.patientMessage.findFirst({
          where: { id: input.messageId },
          include: { patient: true },
        });
        if (!message || message.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return ctx.prisma.patientMessage.update({
          where: { id: input.messageId },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }),

    unreadCount: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        // テナント検証
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) return 0;

        return ctx.prisma.patientMessage.count({
          where: {
            patientId: input.patientId,
            isRead: false,
            senderType: "PATIENT",
          },
        });
      }),
  }),

  // 通知
  notification: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.string(), limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.patientNotification.findMany({
          where: { patientId: input.patientId },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        });
      }),

    create: protectedProcedure
      .input(z.object({
        patientId: z.string(),
        title: z.string(),
        message: z.string(),
        type: z.enum(["APPOINTMENT", "LAB_RESULT", "PRESCRIPTION", "MESSAGE", "REMINDER", "GENERAL"]),
        linkUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.patientNotification.create({
          data: input,
        });
      }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // テナント検証
        const notification = await ctx.prisma.patientNotification.findFirst({
          where: { id: input.notificationId },
          include: { patient: true },
        });
        if (!notification || notification.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return ctx.prisma.patientNotification.update({
          where: { id: input.notificationId },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }),

    markAllAsRead: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // テナント検証
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.patientNotification.updateMany({
          where: {
            patientId: input.patientId,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }),

    unreadCount: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        // テナント検証
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) return 0;

        return ctx.prisma.patientNotification.count({
          where: {
            patientId: input.patientId,
            isRead: false,
          },
        });
      }),
  }),

  // お薬手帳
  medication: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.medicationRecord.findMany({
          where: { patientId: input.patientId },
          include: {
            prescription: true,
          },
          orderBy: { createdAt: "desc" },
        });
      }),

    add: protectedProcedure
      .input(z.object({
        patientId: z.string(),
        medicationName: z.string(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        prescribedBy: z.string().optional(),
        pharmacyName: z.string().optional(),
        notes: z.string().optional(),
        type: z.enum(["PRESCRIPTION", "OTC", "SUPPLEMENT"]).default("PRESCRIPTION"),
        prescriptionId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        return ctx.prisma.medicationRecord.create({
          data: input,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          medicationName: z.string().optional(),
          dosage: z.string().optional(),
          frequency: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        const record = await ctx.prisma.medicationRecord.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!record || record.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return ctx.prisma.medicationRecord.update({
          where: { id: input.id },
          data: input.data,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const record = await ctx.prisma.medicationRecord.findFirst({
          where: { id: input.id },
          include: { patient: true },
        });
        if (!record || record.patient.tenantId !== ctx.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        return ctx.prisma.medicationRecord.delete({
          where: { id: input.id },
        });
      }),

    // 現在服用中の薬
    current: protectedProcedure
      .input(z.object({ patientId: z.string() }))
      .query(async ({ ctx, input }) => {
        const patient = await ctx.prisma.patient.findFirst({
          where: { id: input.patientId, tenantId: ctx.tenantId },
        });
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        const today = new Date();
        return ctx.prisma.medicationRecord.findMany({
          where: {
            patientId: input.patientId,
            OR: [
              { endDate: null },
              { endDate: { gte: today } },
            ],
          },
          orderBy: { startDate: "desc" },
        });
      }),
  }),

  // 患者ダッシュボード情報
  dashboard: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 次回予約
      const nextAppointment = await ctx.prisma.appointment.findFirst({
        where: {
          patientId: input.patientId,
          appointmentDate: { gte: today },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        include: {
          doctor: { select: { name: true } },
        },
        orderBy: { appointmentDate: "asc" },
      });

      // 未読通知数
      const unreadNotifications = await ctx.prisma.patientNotification.count({
        where: {
          patientId: input.patientId,
          isRead: false,
        },
      });

      // 最近の検査結果
      const recentLabResults = await ctx.prisma.labResult.findMany({
        where: { patientId: input.patientId },
        orderBy: { testDate: "desc" },
        take: 5,
      });

      // 現在の処方
      const activePrescriptions = await ctx.prisma.prescription.findMany({
        where: {
          patientId: input.patientId,
          status: { in: ["PENDING", "DISPENSED"] },
        },
        orderBy: { prescriptionDate: "desc" },
        take: 5,
      });

      // 最近の診療記録
      const recentRecords = await ctx.prisma.medicalRecord.findMany({
        where: { patientId: input.patientId },
        orderBy: { recordDate: "desc" },
        take: 3,
        select: {
          id: true,
          recordDate: true,
          diagnosis: true,
          doctor: { select: { name: true } },
        },
      });

      return {
        patient,
        nextAppointment,
        unreadNotifications,
        recentLabResults,
        activePrescriptions,
        recentRecords,
      };
    }),

  // 予約一覧
  appointments: protectedProcedure
    .input(z.object({
      patientId: z.string(),
      upcoming: z.boolean().default(true),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return ctx.prisma.appointment.findMany({
        where: {
          patientId: input.patientId,
          appointmentDate: input.upcoming ? { gte: today } : { lt: today },
        },
        include: {
          doctor: { select: { name: true } },
        },
        orderBy: { appointmentDate: input.upcoming ? "asc" : "desc" },
        take: input.limit,
      });
    }),

  // 検査結果一覧
  labResults: protectedProcedure
    .input(z.object({ patientId: z.string(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findFirst({
        where: { id: input.patientId, tenantId: ctx.tenantId },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.labResult.findMany({
        where: { patientId: input.patientId },
        orderBy: { testDate: "desc" },
        take: input.limit,
      });
    }),
});
