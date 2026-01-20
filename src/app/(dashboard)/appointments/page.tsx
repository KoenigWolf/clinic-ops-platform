"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Plus, Video, Clock, User, Phone } from "lucide-react";
import { AppointmentDialog } from "@/components/appointments/appointment-dialog";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  SCHEDULED: "予約済",
  CONFIRMED: "確認済",
  WAITING: "待機中",
  IN_PROGRESS: "診療中",
  COMPLETED: "完了",
  CANCELLED: "キャンセル",
  NO_SHOW: "未来院",
};

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  WAITING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: appointments, refetch } = trpc.appointment.list.useQuery({
    date: selectedDate,
  });

  const updateStatusMutation = trpc.appointment.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  // Video session mutations
  const createSessionMutation = trpc.video.createSession.useMutation();
  const getTokenMutation = trpc.video.getToken.useMutation();
  const startSessionMutation = trpc.video.startSession.useMutation();

  const handleStartOnlineConsultation = async (appointmentId: string) => {
    try {
      // Update status to IN_PROGRESS
      await updateStatusMutation.mutateAsync({ id: appointmentId, status: "IN_PROGRESS" });

      // Create video session
      const session = await createSessionMutation.mutateAsync({ appointmentId });

      // Get token and room URL
      const { token, roomUrl } = await getTokenMutation.mutateAsync({ sessionId: session.id });

      // Start session
      await startSessionMutation.mutateAsync({ sessionId: session.id });

      // Navigate to video page with session info
      router.push(`/video?sessionId=${session.id}&roomUrl=${encodeURIComponent(roomUrl)}&token=${encodeURIComponent(token || "")}`);
    } catch {
      toast.error("オンライン診療の開始に失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
          <p className="text-gray-500">診療予約の管理・スケジュール確認</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規予約
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>カレンダー</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ja}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "yyyy年M月d日 (E)", { locale: ja })} の予約
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments?.appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                この日の予約はありません
              </div>
            ) : (
              <div className="space-y-4">
                {appointments?.appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[80px]">
                        <p className="text-lg font-semibold">
                          {format(new Date(apt.startTime), "HH:mm")}
                        </p>
                        <p className="text-sm text-gray-500">
                          ~ {format(new Date(apt.endTime), "HH:mm")}
                        </p>
                      </div>

                      <div className="border-l pl-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <p className="font-medium">
                            {apt.patient.lastName} {apt.patient.firstName}
                          </p>
                          <span className="text-sm text-gray-500">
                            ({apt.patient.patientNumber})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            担当: {apt.doctor.name}
                          </p>
                        </div>
                        {apt.reason && (
                          <p className="text-sm text-gray-500 mt-1">
                            {apt.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {apt.isOnline && (
                        <Badge variant="outline" className="gap-1">
                          <Video className="h-3 w-3" />
                          オンライン
                        </Badge>
                      )}
                      <Badge className={statusColors[apt.status]}>
                        {statusLabels[apt.status]}
                      </Badge>

                      {/* Quick Actions */}
                      {apt.status === "SCHEDULED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: apt.id,
                              status: "WAITING",
                            })
                          }
                        >
                          受付
                        </Button>
                      )}
                      {apt.status === "WAITING" && (
                        apt.isOnline ? (
                          <Button
                            size="sm"
                            onClick={() => handleStartOnlineConsultation(apt.id)}
                            disabled={createSessionMutation.isPending}
                            className="gap-1 bg-purple-600 hover:bg-purple-700"
                          >
                            <Phone className="h-4 w-4" />
                            {createSessionMutation.isPending ? "準備中..." : "オンライン診療開始"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: apt.id,
                                status: "IN_PROGRESS",
                              })
                            }
                          >
                            開始
                          </Button>
                        )
                      )}
                      {apt.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: apt.id,
                              status: "COMPLETED",
                            })
                          }
                        >
                          完了
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        onSuccess={() => {
          refetch();
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
