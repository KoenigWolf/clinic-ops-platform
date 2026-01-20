import { router, protectedProcedure } from "../trpc";
import { getDateRange, getMonthRange } from "@/lib/date-utils";

export const dashboardRouter = router({
  // ホーム画面用データを1回で取得
  get: protectedProcedure.query(async ({ ctx }) => {
    const todayRange = getDateRange(new Date());
    const monthRange = getMonthRange();

    // すべてのクエリを並列実行
    const [
      totalPatients,
      recentPatients,
      todayAppointments,
      pendingPrescriptions,
      monthlyRevenue,
    ] = await Promise.all([
      // 総患者数
      ctx.prisma.patient.count({
        where: { tenantId: ctx.tenantId, isActive: true },
      }),
      // 最近の患者 (5件)
      ctx.prisma.patient.findMany({
        where: { tenantId: ctx.tenantId, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          patientNumber: true,
          lastName: true,
          firstName: true,
          updatedAt: true,
        },
      }),
      // 本日の予約
      ctx.prisma.appointment.findMany({
        where: {
          tenantId: ctx.tenantId,
          appointmentDate: todayRange,
        },
        include: {
          patient: {
            select: { lastName: true, firstName: true },
          },
        },
        orderBy: { startTime: "asc" },
      }),
      // 未処理処方
      ctx.prisma.prescription.count({
        where: {
          patient: { tenantId: ctx.tenantId },
          status: "PENDING",
        },
      }),
      // 今月の売上
      ctx.prisma.invoice.aggregate({
        where: {
          tenantId: ctx.tenantId,
          status: "PAID",
          createdAt: monthRange,
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalPatients,
      recentPatients,
      todayAppointments,
      pendingPrescriptions,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
    };
  }),
});
