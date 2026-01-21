"use client";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MessageSquare,
  Pill,
  Bell,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  PageHeader,
  StatCard,
  StatGrid,
  ContentCard,
  SectionHeader,
  EmptyState,
} from "@/components/layout";

export default function PortalDashboard() {
  const { data: dashboard, isLoading, isError, refetch } = trpc.portal.myDashboard.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5">
              <Skeleton className="h-3 w-14 mb-3" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <Skeleton className="h-5 w-24 mb-4" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="マイページ"
          description="診療情報やお知らせを確認できます"
        />
        <EmptyState
          message="データの読み込みに失敗しました"
          action={
            <Button variant="outline" onClick={() => refetch()}>
              再試行
            </Button>
          }
        />
      </div>
    );
  }

  const stats = [
    { label: "予約", value: dashboard?.upcomingAppointments || 0, href: "/portal/appointments" },
    { label: "未読メッセージ", value: dashboard?.unreadMessages || 0, href: "/portal/messages" },
    { label: "服用中の薬", value: dashboard?.activeMedications || 0, href: "/portal/medications" },
    { label: "お知らせ", value: dashboard?.unreadNotifications || 0, href: "/portal/notifications" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="マイページ"
        description="診療情報やお知らせを確認できます"
      />

      <StatGrid columns={4}>
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            href={stat.href}
          />
        ))}
      </StatGrid>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Upcoming Appointments */}
        <div>
          <SectionHeader title="予約" viewAllHref="/portal/appointments" />
          {!dashboard?.appointments?.length ? (
            <EmptyState
              message="予約はありません"
              icon={Calendar}
              action={
                <Link href="/portal/appointments">
                  <Button variant="outline" size="sm">
                    予約を取る
                  </Button>
                </Link>
              }
            />
          ) : (
            <ContentCard divided>
              {dashboard.appointments.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
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
            </ContentCard>
          )}
        </div>

        {/* Recent Messages */}
        <div>
          <SectionHeader title="メッセージ" viewAllHref="/portal/messages" />
          {!dashboard?.recentMessages?.length ? (
            <EmptyState message="メッセージはありません" icon={MessageSquare} />
          ) : (
            <ContentCard divided>
              {dashboard.recentMessages.slice(0, 3).map((msg) => (
                <Link
                  key={msg.id}
                  href="/portal/messages"
                  className="block p-3 hover:bg-gray-50/50 transition-colors"
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
            </ContentCard>
          )}
        </div>

        {/* Current Medications */}
        <div>
          <SectionHeader title="お薬手帳" viewAllHref="/portal/medications" />
          {!dashboard?.currentMedications?.length ? (
            <EmptyState message="服用中の薬はありません" icon={Pill} />
          ) : (
            <ContentCard divided>
              {dashboard.currentMedications.slice(0, 3).map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{med.medicationName}</p>
                    <p className="text-xs text-gray-500">{med.dosage}</p>
                  </div>
                  <Badge variant="secondary">{med.frequency}</Badge>
                </div>
              ))}
            </ContentCard>
          )}
        </div>

        {/* Notifications */}
        <div>
          <SectionHeader title="お知らせ" viewAllHref="/portal/notifications" />
          {!dashboard?.notifications?.length ? (
            <EmptyState message="お知らせはありません" icon={Bell} />
          ) : (
            <ContentCard divided>
              {dashboard.notifications.slice(0, 3).map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-3"
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
            </ContentCard>
          )}
        </div>
      </div>
    </div>
  );
}
