"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, Pill, Banknote } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: patients } = trpc.patient.list.useQuery({ limit: 5 });
  const { data: appointments } = trpc.appointment.today.useQuery();
  const { data: pendingPrescriptions } = trpc.prescription.pendingCount.useQuery();
  const { data: monthlyRevenue } = trpc.billing.monthlyRevenue.useQuery();

  const stats = [
    {
      name: "総患者数",
      value: patients?.total || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "本日の予約",
      value: appointments?.length || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "未処理処方",
      value: pendingPrescriptions || 0,
      icon: Pill,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      name: "今月の売上",
      value: `¥${(monthlyRevenue || 0).toLocaleString()}`,
      icon: Banknote,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500">
          おかえりなさい、{session?.user?.name}さん
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.name}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>本日の予約</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments && appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {apt.patient.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {apt.patient.lastName} {apt.patient.firstName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(apt.startTime).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {new Date(apt.endTime).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {apt.isOnline && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                        オンライン
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        apt.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : apt.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700"
                          : apt.status === "WAITING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {apt.status === "SCHEDULED" && "予約済"}
                      {apt.status === "CONFIRMED" && "確認済"}
                      {apt.status === "WAITING" && "待機中"}
                      {apt.status === "IN_PROGRESS" && "診療中"}
                      {apt.status === "COMPLETED" && "完了"}
                      {apt.status === "CANCELLED" && "キャンセル"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              本日の予約はありません
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <Card>
        <CardHeader>
          <CardTitle>最近の患者</CardTitle>
        </CardHeader>
        <CardContent>
          {patients && patients.patients.length > 0 ? (
            <div className="space-y-4">
              {patients.patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {patient.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {patient.lastName} {patient.firstName}
                      </p>
                      <p className="text-sm text-gray-500">
                        患者番号: {patient.patientNumber}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(patient.updatedAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              患者データがありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
