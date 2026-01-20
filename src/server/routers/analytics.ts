import { router, protectedProcedure } from "../trpc";

export const analyticsRouter = router({
  // 経営ダッシュボード - 全データを1回で取得
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // 過去30日の開始日
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 本日の範囲
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 過去12ヶ月の月別クエリを事前に構築
    const monthlyQueries = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return {
        month: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`,
        start,
        end,
      };
    });

    // すべてのクエリを並列実行
    const [
      // Overview stats (8 queries)
      thisMonthPatients,
      lastMonthPatients,
      thisMonthRecords,
      lastMonthRecords,
      thisMonthAppointments,
      lastMonthAppointments,
      thisMonthRevenue,
      lastMonthRevenue,
      // Daily records
      dailyRecordsRaw,
      // Monthly revenue (12 queries in parallel)
      ...monthlyRevenueResults
    ] = await Promise.all([
      // Overview - 今月/先月の比較データ
      ctx.prisma.patient.count({
        where: { tenantId: ctx.tenantId, createdAt: { gte: startOfMonth } },
      }),
      ctx.prisma.patient.count({
        where: {
          tenantId: ctx.tenantId,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      ctx.prisma.medicalRecord.count({
        where: { patient: { tenantId: ctx.tenantId }, recordDate: { gte: startOfMonth } },
      }),
      ctx.prisma.medicalRecord.count({
        where: {
          patient: { tenantId: ctx.tenantId },
          recordDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      ctx.prisma.appointment.count({
        where: { tenantId: ctx.tenantId, appointmentDate: { gte: startOfMonth } },
      }),
      ctx.prisma.appointment.count({
        where: {
          tenantId: ctx.tenantId,
          appointmentDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      ctx.prisma.invoice.aggregate({
        where: { tenantId: ctx.tenantId, status: "PAID", createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      ctx.prisma.invoice.aggregate({
        where: {
          tenantId: ctx.tenantId,
          status: "PAID",
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { total: true },
      }),
      // Daily records (過去30日)
      ctx.prisma.medicalRecord.groupBy({
        by: ["recordDate"],
        where: { patient: { tenantId: ctx.tenantId }, recordDate: { gte: thirtyDaysAgo } },
        _count: true,
        orderBy: { recordDate: "asc" },
      }),
      // Monthly revenue (12ヶ月分を並列)
      ...monthlyQueries.map((q) =>
        ctx.prisma.invoice.aggregate({
          where: {
            tenantId: ctx.tenantId,
            status: "PAID",
            createdAt: { gte: q.start, lte: q.end },
          },
          _sum: { total: true },
          _count: true,
        })
      ),
    ]);

    // 第2バッチ: 残りのクエリを並列実行
    const [
      appointmentsByType,
      appointmentsByStatus,
      recordsByDoctorRaw,
      appointmentsByHourRaw,
      patientTypeRatioRaw,
      unpaidSum,
      overdueSum,
      todayAppointments,
    ] = await Promise.all([
      // 予約タイプ別
      ctx.prisma.appointment.groupBy({
        by: ["type"],
        where: { tenantId: ctx.tenantId, appointmentDate: { gte: startOfMonth } },
        _count: true,
      }),
      // 予約ステータス別
      ctx.prisma.appointment.groupBy({
        by: ["status"],
        where: { tenantId: ctx.tenantId, appointmentDate: { gte: todayStart } },
        _count: true,
      }),
      // 医師別診療件数
      ctx.prisma.medicalRecord.groupBy({
        by: ["doctorId"],
        where: { patient: { tenantId: ctx.tenantId }, recordDate: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      // 時間帯別予約
      ctx.prisma.appointment.findMany({
        where: { tenantId: ctx.tenantId, appointmentDate: { gte: thirtyDaysAgo } },
        select: { startTime: true },
      }),
      // 新患・再診比率
      ctx.prisma.appointment.groupBy({
        by: ["type"],
        where: {
          tenantId: ctx.tenantId,
          appointmentDate: { gte: thirtyDaysAgo },
          type: { in: ["INITIAL", "FOLLOWUP"] },
        },
        _count: true,
      }),
      // 未収金
      ctx.prisma.invoice.aggregate({
        where: { tenantId: ctx.tenantId, status: { in: ["SENT", "OVERDUE"] } },
        _sum: { total: true },
        _count: true,
      }),
      ctx.prisma.invoice.aggregate({
        where: { tenantId: ctx.tenantId, status: "OVERDUE" },
        _sum: { total: true },
        _count: true,
      }),
      // 本日の予約
      ctx.prisma.appointment.findMany({
        where: { tenantId: ctx.tenantId, appointmentDate: { gte: todayStart, lt: tomorrow } },
        include: {
          patient: { select: { firstName: true, lastName: true, patientNumber: true } },
          doctor: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),
    ]);

    // 医師情報を取得 (recordsByDoctorに依存)
    const doctorIds = recordsByDoctorRaw.map((r) => r.doctorId);
    const doctors = doctorIds.length > 0
      ? await ctx.prisma.user.findMany({
          where: { id: { in: doctorIds } },
          select: { id: true, name: true },
        })
      : [];

    // データ整形
    const calcChange = (current: number, previous: number) =>
      previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : null;

    // 日別診療件数を整形
    const dailyRecords: { date: string; count: number }[] = [];
    const currentDate = new Date(thirtyDaysAgo);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const record = dailyRecordsRaw.find(
        (r) => r.recordDate.toISOString().split("T")[0] === dateStr
      );
      dailyRecords.push({ date: dateStr, count: record?._count || 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 月別売上を整形
    const monthlyRevenue = monthlyQueries.map((q, i) => ({
      month: q.month,
      revenue: monthlyRevenueResults[i]._sum.total || 0,
      count: monthlyRevenueResults[i]._count,
    }));

    // 時間帯別予約を集計
    const hourCounts: Record<number, number> = {};
    for (let i = 8; i <= 20; i++) hourCounts[i] = 0;
    appointmentsByHourRaw.forEach((a) => {
      const hour = a.startTime.getHours();
      if (hourCounts[hour] !== undefined) hourCounts[hour]++;
    });
    const appointmentsByHour = Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));

    // 新患・再診比率
    const initial = patientTypeRatioRaw.find((a) => a.type === "INITIAL")?._count || 0;
    const followup = patientTypeRatioRaw.find((a) => a.type === "FOLLOWUP")?._count || 0;
    const patientTotal = initial + followup;

    return {
      overview: {
        patients: {
          thisMonth: thisMonthPatients,
          lastMonth: lastMonthPatients,
          change: calcChange(thisMonthPatients, lastMonthPatients),
        },
        records: {
          thisMonth: thisMonthRecords,
          lastMonth: lastMonthRecords,
          change: calcChange(thisMonthRecords, lastMonthRecords),
        },
        appointments: {
          thisMonth: thisMonthAppointments,
          lastMonth: lastMonthAppointments,
          change: calcChange(thisMonthAppointments, lastMonthAppointments),
        },
        revenue: {
          thisMonth: thisMonthRevenue._sum.total || 0,
          lastMonth: lastMonthRevenue._sum.total || 0,
          change: calcChange(
            thisMonthRevenue._sum.total || 0,
            lastMonthRevenue._sum.total || 0
          ),
        },
      },
      dailyRecords,
      monthlyRevenue,
      appointmentsByType: appointmentsByType.map((s) => ({ type: s.type, count: s._count })),
      appointmentsByStatus: appointmentsByStatus.map((s) => ({ status: s.status, count: s._count })),
      recordsByDoctor: recordsByDoctorRaw.map((r) => ({
        doctorId: r.doctorId,
        doctorName: doctors.find((d) => d.id === r.doctorId)?.name || "不明",
        count: r._count,
      })),
      appointmentsByHour,
      patientTypeRatio: {
        initial,
        followup,
        total: patientTotal,
        initialRatio: patientTotal > 0 ? ((initial / patientTotal) * 100).toFixed(1) : "0",
        followupRatio: patientTotal > 0 ? ((followup / patientTotal) * 100).toFixed(1) : "0",
      },
      unpaidInvoices: {
        totalUnpaid: unpaidSum._sum.total || 0,
        unpaidCount: unpaidSum._count,
        totalOverdue: overdueSum._sum.total || 0,
        overdueCount: overdueSum._count,
      },
      todayAppointments,
    };
  }),
});
