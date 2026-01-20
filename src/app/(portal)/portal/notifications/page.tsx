"use client";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

const TYPE_CONFIG = {
  APPOINTMENT: { icon: Calendar, color: "bg-blue-100 text-blue-600" },
  LAB_RESULT: { icon: FileText, color: "bg-green-100 text-green-600" },
  PRESCRIPTION: { icon: Pill, color: "bg-purple-100 text-purple-600" },
  MESSAGE: { icon: MessageSquare, color: "bg-orange-100 text-orange-600" },
  GENERAL: { icon: Bell, color: "bg-gray-100 text-gray-600" },
};

export default function NotificationsPage() {
  const { data: notifications, refetch } = trpc.portal.myNotifications.useQuery();
  const { data: unreadCount } = trpc.portal.myUnreadNotificationCount.useQuery();

  const markAsReadMutation = trpc.portal.markMyNotificationAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllAsReadMutation = trpc.portal.markAllMyNotificationsAsRead.useMutation({
    onSuccess: () => {
      toast.success("すべて既読にしました");
      refetch();
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">お知らせ</h1>
          <p className="text-gray-500">クリニックからのお知らせ</p>
        </div>
        {(unreadCount || 0) > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            すべて既読にする
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications?.length || 0}</p>
                <p className="text-xs text-gray-500">すべてのお知らせ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount || 0}</p>
                <p className="text-xs text-gray-500">未読</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">お知らせ一覧</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!notifications?.length ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>お知らせはありません</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.GENERAL;
                const Icon = config.icon;

                return (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notif.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{notif.title}</h3>
                              {!notif.isRead && (
                                <Badge variant="destructive" className="text-xs">
                                  新着
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                                locale: ja,
                              })}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notif.id)}
                            >
                              既読にする
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
