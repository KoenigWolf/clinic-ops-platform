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
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { PageHeader, StatCard, StatGrid, EmptyState } from "@/components/layout";
import { labels } from "@/lib/labels";

const { portal: { notifications: pageLabels }, common } = labels;

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
      toast.success(labels.messages.success.statusUpdated);
      refetch();
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          (unreadCount || 0) > 0 ? (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {pageLabels.markAllAsRead}
            </Button>
          ) : null
        }
      />

      <StatGrid columns={2}>
        <StatCard label={pageLabels.stats.total} value={notifications?.length || 0} />
        <StatCard label={pageLabels.stats.unread} value={unreadCount || 0} />
      </StatGrid>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{pageLabels.listTitle}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!notifications?.length ? (
            <EmptyState message={pageLabels.empty} icon={Bell} />
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
                                  {common.new}
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
                              disabled={markAsReadMutation.isPending}
                              onClick={() => handleMarkAsRead(notif.id)}
                            >
                              {markAsReadMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              )}
                              {pageLabels.markAsRead}
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
