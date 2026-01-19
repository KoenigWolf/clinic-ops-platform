"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Phone, PhoneOff, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { VideoRoom } from "@/components/video/video-room";

export default function VideoPage() {
  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    roomUrl: string;
    token: string | null;
  } | null>(null);

  // Get today's online appointments
  const { data: appointments } = trpc.appointment.list.useQuery({
    date: new Date(),
  });

  const onlineAppointments = appointments?.appointments.filter(
    (apt) => apt.isOnline && ["SCHEDULED", "CONFIRMED", "WAITING", "IN_PROGRESS"].includes(apt.status)
  );

  const createSessionMutation = trpc.video.createSession.useMutation({
    onError: (error) => {
      toast.error(error.message || "セッションの作成に失敗しました");
    },
  });

  const getTokenMutation = trpc.video.getToken.useMutation();

  const startSessionMutation = trpc.video.startSession.useMutation();
  const endSessionMutation = trpc.video.endSession.useMutation();

  const handleStartSession = async (appointmentId: string) => {
    try {
      // Create session
      const session = await createSessionMutation.mutateAsync({ appointmentId });

      // Get token
      const { token, roomUrl } = await getTokenMutation.mutateAsync({
        sessionId: session.id,
      });

      // Start session
      await startSessionMutation.mutateAsync({ sessionId: session.id });

      setActiveSession({
        sessionId: session.id,
        roomUrl,
        token,
      });
    } catch {
      toast.error("診療の開始に失敗しました");
    }
  };

  const handleEndSession = async () => {
    if (activeSession) {
      try {
        await endSessionMutation.mutateAsync({ sessionId: activeSession.sessionId });
        setActiveSession(null);
        toast.success("診療を終了しました");
      } catch {
        toast.error("診療の終了に失敗しました");
      }
    }
  };

  if (activeSession) {
    return (
      <div className="h-[calc(100vh-64px)]">
        <VideoRoom
          roomUrl={activeSession.roomUrl}
          token={activeSession.token}
          onLeave={handleEndSession}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">オンライン診療</h1>
        <p className="text-gray-500">ビデオ通話による診療</p>
      </div>

      {/* Today's Online Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            本日のオンライン診療
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!onlineAppointments || onlineAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>本日のオンライン診療予約はありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {onlineAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {apt.patient.lastName} {apt.patient.firstName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {format(new Date(apt.startTime), "HH:mm", { locale: ja })}
                        {" - "}
                        {format(new Date(apt.endTime), "HH:mm", { locale: ja })}
                      </div>
                      {apt.reason && (
                        <p className="text-sm text-gray-500 mt-1">{apt.reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        apt.status === "WAITING"
                          ? "bg-yellow-100 text-yellow-700"
                          : apt.status === "IN_PROGRESS"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {apt.status === "WAITING" && "待機中"}
                      {apt.status === "IN_PROGRESS" && "診療中"}
                      {apt.status === "SCHEDULED" && "予約済"}
                      {apt.status === "CONFIRMED" && "確認済"}
                    </Badge>

                    <Button
                      onClick={() => handleStartSession(apt.id)}
                      disabled={createSessionMutation.isPending}
                      className="gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      診療開始
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>オンライン診療について</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">1. 事前準備</h4>
              <p className="text-sm text-blue-600">
                カメラとマイクが正常に動作することを確認してください
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-700 mb-2">2. 診療開始</h4>
              <p className="text-sm text-green-600">
                「診療開始」ボタンをクリックしてビデオ通話を開始します
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-700 mb-2">3. 診療終了</h4>
              <p className="text-sm text-purple-600">
                診療が終わったら「終了」ボタンで通話を終了してください
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
