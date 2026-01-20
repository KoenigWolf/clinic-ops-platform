"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Phone, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { VideoRoom } from "@/components/video/video-room";
import { EmptyState, PageHeader, StatusBadge } from "@/components/layout";
import { labels } from "@/lib/labels";

const { pages: { video: pageLabels }, common, messages } = labels;

// Wrapper component that uses searchParams
function VideoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial session from URL parameters
  const urlSessionId = searchParams.get("sessionId");
  const urlRoomUrl = searchParams.get("roomUrl");
  const urlToken = searchParams.get("token");

  const [activeSession, setActiveSession] = useState<{
    sessionId: string;
    roomUrl: string;
    token: string | null;
  } | null>(() => {
    // Initialize from URL params if present
    if (urlSessionId && urlRoomUrl) {
      return {
        sessionId: urlSessionId,
        roomUrl: urlRoomUrl,
        token: urlToken || null,
      };
    }
    return null;
  });

  // Clear URL params after initialization (only run once)
  const urlClearedRef = useRef(false);
  useEffect(() => {
    if (urlSessionId && urlRoomUrl && !urlClearedRef.current) {
      urlClearedRef.current = true;
      router.replace("/video");
    }
  }, [router, urlRoomUrl, urlSessionId]);

  // Get today's online appointments (refetch every 10 seconds)
  const { data: appointments, isLoading, isError, refetch } = trpc.appointment.list.useQuery({
    date: new Date(),
  }, {
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const onlineAppointments = useMemo(() => (
    appointments?.appointments.filter(
      (apt) => apt.isOnline && ["SCHEDULED", "CONFIRMED", "WAITING", "IN_PROGRESS"].includes(apt.status)
    )
  ), [appointments?.appointments]);

  const createSessionMutation = trpc.video.createSession.useMutation({
    onError: (error) => {
      toast.error(error.message || messages.error.onlineConsultationFailed);
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
      toast.error(messages.error.onlineConsultationFailed);
    }
  };

  const handleEndSession = async () => {
    if (activeSession) {
      try {
        await endSessionMutation.mutateAsync({ sessionId: activeSession.sessionId });
        setActiveSession(null);
        toast.success(messages.success.consultationEnded);
      } catch {
        toast.error(messages.error.consultationEndFailed);
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
      <PageHeader title={pageLabels.title} description={pageLabels.description} />

      {/* Today's Online Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {pageLabels.todayOnline}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <EmptyState
              message={common.loadFailed}
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  {common.retry}
                </Button>
              }
            />
          ) : isLoading ? (
            <div className="text-center py-8 text-gray-500">{common.loading}</div>
          ) : !onlineAppointments || onlineAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>{pageLabels.empty}</p>
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
                    <StatusBadge status={apt.status} />

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
          <CardTitle>{pageLabels.instructions.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">{pageLabels.instructions.preparation.title}</h4>
              <p className="text-sm text-blue-600">
                {pageLabels.instructions.preparation.description}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-700 mb-2">{pageLabels.instructions.start.title}</h4>
              <p className="text-sm text-green-600">
                {pageLabels.instructions.start.description}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-700 mb-2">{pageLabels.instructions.end.title}</h4>
              <p className="text-sm text-purple-600">
                {pageLabels.instructions.end.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main export with Suspense boundary for useSearchParams
export default function VideoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    }>
      <VideoPageContent />
    </Suspense>
  );
}
