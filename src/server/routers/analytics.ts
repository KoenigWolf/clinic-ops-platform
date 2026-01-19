import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const analyticsRouter = router({
  // ==================== 経営ダッシュボード ====================

  // 概要統計
  overview: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // 今月の患者数
    const thisMonthPatients = await ctx.prisma.patient.count({
      where: {
        tenantId: ctx.tenantId,
        createdAt: { gte: startOfMonth },
      },
    });

    // 先月の患者数
    const lastMonthPatients = await ctx.prisma.patient.count({
      where: {
        tenantId: ctx.tenantId,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // 今月の診療件数
    const thisMonthRecords = await ctx.prisma.medicalRecord.count({
      where: {
        patient: { tenantId: ctx.tenantId },
        recordDate: { gte: startOfMonth },
      },
    });

    // 先月の診療件数
    const lastMonthRecords = await ctx.prisma.medicalRecord.count({
      where: {
        patient: { tenantId: ctx.tenantId },
        recordDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // 今月の予約件数
    const thisMonthAppointments = await ctx.prisma.appointment.count({
      where: {
        tenantId: ctx.tenantId,
        appointmentDate: { gte: startOfMonth },
      },
    });

    // 先月の予約件数
    const lastMonthAppointments = await ctx.prisma.appointment.count({
      where: {
        tenantId: ctx.tenantId,
        appointmentDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // 今月の売上
    const thisMonthRevenue = await ctx.prisma.invoice.aggregate({
      where: {
        tenantId: ctx.tenantId,
        status: "PAID",
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    });

    // 先月の売上
    const lastMonthRevenue = await ctx.prisma.invoice.aggregate({
      where: {
        tenantId: ctx.tenantId,
        status: "PAID",
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: { total: true },
    });

    // 総患者数
    const totalPatients = await ctx.prisma.patient.count({
      where: { tenantId: ctx.tenantId, isActive: true },
    });

    return {
      patients: {
        thisMonth: thisMonthPatients,
        lastMonth: lastMonthPatients,
        total: totalPatients,
        change: lastMonthPatients > 0
          ? ((thisMonthPatients - lastMonthPatients) / lastMonthPatients * 100).toFixed(1)
          : null,
      },
      records: {
        thisMonth: thisMonthRecords,
        lastMonth: lastMonthRecords,
        change: lastMonthRecords > 0
          ? ((thisMonthRecords - lastMonthRecords) / lastMonthRecords * 100).toFixed(1)
          : null,
      },
      appointments: {
        thisMonth: thisMonthAppointments,
        lastMonth: lastMonthAppointments,
        change: lastMonthAppointments > 0
          ? ((thisMonthAppointments - lastMonthAppointments) / lastMonthAppointments * 100).toFixed(1)
          : null,
      },
      revenue: {
        thisMonth: thisMonthRevenue._sum.total || 0,
        lastMonth: lastMonthRevenue._sum.total || 0,
        change: (lastMonthRevenue._sum.total || 0) > 0
          ? (((thisMonthRevenue._sum.total || 0) - (lastMonthRevenue._sum.total || 0)) /
            (lastMonthRevenue._sum.total || 1) * 100).toFixed(1)
          : null,
      },
    };
  }),

  // 日別診療件数 (過去30日)
  dailyRecords: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const records = await ctx.prisma.medicalRecord.groupBy({
        by: ["recordDate"],
        where: {
          patient: { tenantId: ctx.tenantId },
          recordDate: { gte: startDate },
        },
        _count: true,
        orderBy: { recordDate: "asc" },
      });

      // 日付ごとのデータを整形
      const result: { date: string; count: number }[] = [];
      const currentDate = new Date(startDate);
      const today = new Date();

      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const record = records.find(
          (r) => r.recordDate.toISOString().split("T")[0] === dateStr
        );
        result.push({
          date: dateStr,
          count: record?._count || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    }),

  // 月別売上推移 (過去12ヶ月)
  monthlyRevenue: protectedProcedure.query(async ({ ctx }) => {
    const result: { month: string; revenue: number; count: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const revenue = await ctx.prisma.invoice.aggregate({
        where: {
          tenantId: ctx.tenantId,
          status: "PAID",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { total: true },
        _count: true,
      });

      result.push({
        month: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`,
        revenue: revenue._sum.total || 0,
        count: revenue._count,
      });
    }

    return result;
  }),

  // 予約タイプ別統計
  appointmentsByType: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await ctx.prisma.appointment.groupBy({
      by: ["type"],
      where: {
        tenantId: ctx.tenantId,
        appointmentDate: { gte: startOfMonth },
      },
      _count: true,
    });

    return stats.map((s) => ({
      type: s.type,
      count: s._count,
    }));
  }),

  // 予約ステータス別統計
  appointmentsByStatus: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await ctx.prisma.appointment.groupBy({
      by: ["status"],
      where: {
        tenantId: ctx.tenantId,
        appointmentDate: { gte: today },
      },
      _count: true,
    });

    return stats.map((s) => ({
      status: s.status,
      count: s._count,
    }));
  }),

  // 医師別診療件数
  recordsByDoctor: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const records = await ctx.prisma.medicalRecord.groupBy({
        by: ["doctorId"],
        where: {
          patient: { tenantId: ctx.tenantId },
          recordDate: { gte: startDate },
        },
        _count: true,
      });

      // 医師情報を取得
      const doctorIds = records.map((r) => r.doctorId);
      const doctors = await ctx.prisma.user.findMany({
        where: { id: { in: doctorIds } },
        select: { id: true, name: true },
      });

      return records.map((r) => ({
        doctorId: r.doctorId,
        doctorName: doctors.find((d) => d.id === r.doctorId)?.name || "不明",
        count: r._count,
      }));
    }),

  // 時間帯別予約分布
  appointmentsByHour: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const appointments = await ctx.prisma.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          appointmentDate: { gte: startDate },
        },
        select: { startTime: true },
      });

      // 時間帯別に集計
      const hourCounts: Record<number, number> = {};
      for (let i = 8; i <= 20; i++) {
        hourCounts[i] = 0;
      }

      appointments.forEach((a) => {
        const hour = a.startTime.getHours();
        if (hourCounts[hour] !== undefined) {
          hourCounts[hour]++;
        }
      });

      return Object.entries(hourCounts).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }));
    }),

  // 新患・再診比率
  patientTypeRatio: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const appointments = await ctx.prisma.appointment.groupBy({
        by: ["type"],
        where: {
          tenantId: ctx.tenantId,
          appointmentDate: { gte: startDate },
          type: { in: ["INITIAL", "FOLLOWUP"] },
        },
        _count: true,
      });

      const initial = appointments.find((a) => a.type === "INITIAL")?._count || 0;
      const followup = appointments.find((a) => a.type === "FOLLOWUP")?._count || 0;
      const total = initial + followup;

      return {
        initial,
        followup,
        total,
        initialRatio: total > 0 ? ((initial / total) * 100).toFixed(1) : "0",
        followupRatio: total > 0 ? ((followup / total) * 100).toFixed(1) : "0",
      };
    }),

  // 未収金統計
  unpaidInvoices: protectedProcedure.query(async ({ ctx }) => {
    const [unpaidSum, unpaidCount, overdueSum, overdueCount] = await Promise.all([
      ctx.prisma.invoice.aggregate({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ["SENT", "OVERDUE"] },
        },
        _sum: { total: true },
      }),
      ctx.prisma.invoice.count({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ["SENT", "OVERDUE"] },
        },
      }),
      ctx.prisma.invoice.aggregate({
        where: {
          tenantId: ctx.tenantId,
          status: "OVERDUE",
        },
        _sum: { total: true },
      }),
      ctx.prisma.invoice.count({
        where: {
          tenantId: ctx.tenantId,
          status: "OVERDUE",
        },
      }),
    ]);

    return {
      totalUnpaid: unpaidSum._sum.total || 0,
      unpaidCount,
      totalOverdue: overdueSum._sum.total || 0,
      overdueCount,
    };
  }),

  // 今日の予約
  todayAppointments: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return ctx.prisma.appointment.findMany({
      where: {
        tenantId: ctx.tenantId,
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true, patientNumber: true },
        },
        doctor: {
          select: { name: true },
        },
      },
      orderBy: { startTime: "asc" },
    });
  }),
});
