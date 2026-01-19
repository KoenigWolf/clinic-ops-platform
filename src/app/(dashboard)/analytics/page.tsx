"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  UserPlus,
  UserCheck,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.overview.useQuery();
  const { data: dailyRecords } = trpc.analytics.dailyRecords.useQuery({ days: 30 });
  const { data: monthlyRevenue } = trpc.analytics.monthlyRevenue.useQuery();
  const { data: appointmentsByType } = trpc.analytics.appointmentsByType.useQuery();
  const { data: appointmentsByStatus } = trpc.analytics.appointmentsByStatus.useQuery();
  const { data: recordsByDoctor } = trpc.analytics.recordsByDoctor.useQuery({ days: 30 });
  const { data: appointmentsByHour } = trpc.analytics.appointmentsByHour.useQuery({ days: 30 });
  const { data: patientTypeRatio } = trpc.analytics.patientTypeRatio.useQuery({ days: 30 });
  const { data: unpaidInvoices } = trpc.analytics.unpaidInvoices.useQuery();
  const { data: todayAppointments } = trpc.analytics.todayAppointments.useQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const getChangeIcon = (change: string | null) => {
    if (!change) return null;
    const num = parseFloat(change);
    if (num > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (num < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getChangeColor = (change: string | null) => {
    if (!change) return "text-gray-500";
    const num = parseFloat(change);
    if (num > 0) return "text-green-600";
    if (num < 0) return "text-red-600";
    return "text-gray-500";
  };

  const appointmentTypeLabels: Record<string, string> = {
    INITIAL: "初診",
    FOLLOWUP: "再診",
    CHECKUP: "健診",
    VACCINATION: "予防接種",
    CONSULTATION: "相談",
    ONLINE: "オンライン",
    OTHER: "その他",
  };

  const statusLabels: Record<string, string> = {
    SCHEDULED: "予約済み",
    CONFIRMED: "確認済み",
    CHECKED_IN: "来院済み",
    IN_PROGRESS: "診療中",
    COMPLETED: "完了",
    CANCELLED: "キャンセル",
    NO_SHOW: "無断キャンセル",
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">経営分析ダッシュボード</h1>
        <p className="text-gray-500">クリニックの経営状況を可視化</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の売上</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(overview?.revenue.thisMonth || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor(overview?.revenue.change || null)}`}>
              {getChangeIcon(overview?.revenue.change || null)}
              <span>{overview?.revenue.change ? `${overview.revenue.change}%` : "-"}</span>
              <span className="text-gray-400">前月比</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の診療件数</p>
                <p className="text-2xl font-bold">{overview?.records.thisMonth || 0}件</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor(overview?.records.change || null)}`}>
              {getChangeIcon(overview?.records.change || null)}
              <span>{overview?.records.change ? `${overview.records.change}%` : "-"}</span>
              <span className="text-gray-400">前月比</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の予約件数</p>
                <p className="text-2xl font-bold">{overview?.appointments.thisMonth || 0}件</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-200" />
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor(overview?.appointments.change || null)}`}>
              {getChangeIcon(overview?.appointments.change || null)}
              <span>{overview?.appointments.change ? `${overview.appointments.change}%` : "-"}</span>
              <span className="text-gray-400">前月比</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今月の新患数</p>
                <p className="text-2xl font-bold">{overview?.patients.thisMonth || 0}名</p>
              </div>
              <Users className="h-8 w-8 text-orange-200" />
            </div>
            <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor(overview?.patients.change || null)}`}>
              {getChangeIcon(overview?.patients.change || null)}
              <span>{overview?.patients.change ? `${overview.patients.change}%` : "-"}</span>
              <span className="text-gray-400">前月比</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Records Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">日別診療件数 (過去30日)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {dailyRecords?.slice(-30).map((day, i) => {
                const maxCount = Math.max(...(dailyRecords?.map((d) => d.count) || [1]));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: ${day.count}件`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{dailyRecords?.[0]?.date}</span>
              <span>{dailyRecords?.[dailyRecords.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">月別売上推移 (過去12ヶ月)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-2">
              {monthlyRevenue?.map((month, i) => {
                const maxRevenue = Math.max(...(monthlyRevenue?.map((m) => m.revenue) || [1]));
                const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${month.month}: ${formatCurrency(month.revenue)}`}
                    />
                    <span className="text-xs text-gray-400 truncate w-full text-center">
                      {month.month.split("/")[1]}月
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Patient Type Ratio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">新患・再診比率</CardTitle>
            <CardDescription>過去30日間</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <UserPlus className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>初診</span>
                    <span className="font-medium">{patientTypeRatio?.initial || 0}件 ({patientTypeRatio?.initialRatio || 0}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${patientTypeRatio?.initialRatio || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span>再診</span>
                    <span className="font-medium">{patientTypeRatio?.followup || 0}件 ({patientTypeRatio?.followupRatio || 0}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${patientTypeRatio?.followupRatio || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments by Hour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">時間帯別予約分布</CardTitle>
            <CardDescription>過去30日間</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appointmentsByHour?.filter((h) => h.count > 0).slice(0, 8).map((hour) => {
                const maxCount = Math.max(...(appointmentsByHour?.map((h) => h.count) || [1]));
                const width = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;
                return (
                  <div key={hour.hour} className="flex items-center gap-2">
                    <span className="text-sm w-12">{hour.hour}:00</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-sm w-8 text-right">{hour.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Records by Doctor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">医師別診療件数</CardTitle>
            <CardDescription>過去30日間</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recordsByDoctor?.map((doctor) => {
                const maxCount = Math.max(...(recordsByDoctor?.map((d) => d.count) || [1]));
                const width = maxCount > 0 ? (doctor.count / maxCount) * 100 : 0;
                return (
                  <div key={doctor.doctorId} className="flex items-center gap-2">
                    <span className="text-sm w-24 truncate">{doctor.doctorName}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-sm w-10 text-right">{doctor.count}件</span>
                  </div>
                );
              })}
              {!recordsByDoctor?.length && (
                <p className="text-gray-400 text-center py-4">データがありません</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unpaid Invoices */}
        <Card className={unpaidInvoices?.overdueCount ? "border-red-200" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {unpaidInvoices?.overdueCount ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : null}
              未収金状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">未払い</p>
                <p className="text-xl font-bold text-yellow-800">
                  {formatCurrency(unpaidInvoices?.totalUnpaid || 0)}
                </p>
                <p className="text-sm text-yellow-600">{unpaidInvoices?.unpaidCount || 0}件</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">延滞</p>
                <p className="text-xl font-bold text-red-800">
                  {formatCurrency(unpaidInvoices?.totalOverdue || 0)}
                </p>
                <p className="text-sm text-red-600">{unpaidInvoices?.overdueCount || 0}件</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              本日の予約
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!todayAppointments?.length ? (
              <p className="text-gray-400 text-center py-4">本日の予約はありません</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {new Date(apt.startTime).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>
                        {apt.patient.lastName} {apt.patient.firstName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{appointmentTypeLabels[apt.type] || apt.type}</Badge>
                      <Badge
                        className={
                          apt.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : apt.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {statusLabels[apt.status] || apt.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
