"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MessageSquare,
  Pill,
  Bell,
  FileText,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";

export default function PortalDashboard() {
  const { data: dashboard, isLoading } = trpc.portal.myDashboard.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>
        <p className="text-gray-500">診療情報やお知らせを確認できます</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard?.upcomingAppointments || 0}</p>
                <p className="text-xs text-gray-500">予約</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard?.unreadMessages || 0}</p>
                <p className="text-xs text-gray-500">未読メッセージ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Pill className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard?.activeMedications || 0}</p>
                <p className="text-xs text-gray-500">服用中の薬</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard?.unreadNotifications || 0}</p>
                <p className="text-xs text-gray-500">お知らせ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">予約</CardTitle>
              <CardDescription>今後の予約</CardDescription>
            </div>
            <Link href="/portal/appointments">
              <Button variant="ghost" size="sm">
                すべて見る
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!dashboard?.appointments?.length ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p>予約はありません</p>
                <Link href="/portal/appointments">
                  <Button variant="outline" className="mt-4" size="sm">
                    予約を取る
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.appointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(apt.appointmentDate), "M月d日(E)", { locale: ja })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(apt.startTime), "HH:mm")} - {apt.isOnline ? "オンライン診療" : "来院"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{apt.status === "CONFIRMED" ? "確定" : "予約済"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">メッセージ</CardTitle>
              <CardDescription>クリニックからのメッセージ</CardDescription>
            </div>
            <Link href="/portal/messages">
              <Button variant="ghost" size="sm">
                すべて見る
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!dashboard?.recentMessages?.length ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p>メッセージはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentMessages.slice(0, 3).map((msg) => (
                  <Link
                    key={msg.id}
                    href="/portal/messages"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{msg.subject}</p>
                        <p className="text-xs text-gray-500 truncate">{msg.content}</p>
                      </div>
                      {!msg.isRead && (
                        <Badge variant="destructive" className="shrink-0">新着</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ja })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Medications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">お薬手帳</CardTitle>
              <CardDescription>服用中のお薬</CardDescription>
            </div>
            <Link href="/portal/medications">
              <Button variant="ghost" size="sm">
                すべて見る
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!dashboard?.currentMedications?.length ? (
              <div className="text-center py-8 text-gray-500">
                <Pill className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p>服用中の薬はありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.currentMedications.slice(0, 3).map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{med.medicationName}</p>
                      <p className="text-xs text-gray-500">{med.dosage}</p>
                    </div>
                    <Badge variant="secondary">{med.frequency}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">お知らせ</CardTitle>
              <CardDescription>クリニックからのお知らせ</CardDescription>
            </div>
            <Link href="/portal/notifications">
              <Button variant="ghost" size="sm">
                すべて見る
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!dashboard?.notifications?.length ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p>お知らせはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-1.5 rounded-lg ${!notif.isRead ? "bg-blue-100" : "bg-gray-100"}`}>
                      <AlertCircle className={`h-4 w-4 ${!notif.isRead ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ja })}
                      </p>
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
