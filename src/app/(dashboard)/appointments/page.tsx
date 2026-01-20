"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Clock, User, Phone } from "lucide-react";
import { AppointmentDialog } from "@/components/appointments/appointment-dialog";
import { EmptyState, OnlineBadge, PageHeader, StatusBadge } from "@/components/layout";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { labels } from "@/lib/labels";

const { pages: { appointments: pageLabels }, messages } = labels;

export default function AppointmentsPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);

  const {
    data: appointments,
    isLoading,
    isError,
    refetch,
  } = trpc.appointment.list.useQuery({
    date: selectedDate,
  });

  const updateStatusMutation = trpc.appointment.updateStatus.useMutation({
    onError: () => toast.error(messages.error.appointmentUpdateFailed),
    onSuccess: () => refetch(),
  });

  const createSessionMutation = trpc.video.createSession.useMutation();
  const getTokenMutation = trpc.video.getToken.useMutation();
  const startSessionMutation = trpc.video.startSession.useMutation();

  const handleStartOnlineConsultation = async (appointmentId: string) => {
    setStartingSessionId(appointmentId);
    try {
      await updateStatusMutation.mutateAsync({ id: appointmentId, status: "IN_PROGRESS" });
      const session = await createSessionMutation.mutateAsync({ appointmentId });
      const { token, roomUrl } = await getTokenMutation.mutateAsync({ sessionId: session.id });
      await startSessionMutation.mutateAsync({ sessionId: session.id });
      router.push(`/video?sessionId=${session.id}&roomUrl=${encodeURIComponent(roomUrl)}&token=${encodeURIComponent(token || "")}`);
    } catch {
      toast.error(messages.error.onlineConsultationFailed);
    } finally {
      setStartingSessionId(null);
    }
  };

  const dateTitle = useMemo(
    () => format(selectedDate, "yyyy年M月d日 (E)", { locale: ja }),
    [selectedDate]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {pageLabels.newAppointment}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{pageLabels.calendar}</CardTitle>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {pageLabels.dateTitle(dateTitle)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isError ? (
              <EmptyState
                message={labels.common.loadFailed}
                action={
                  <Button type="button" variant="outline" onClick={() => refetch()}>
                    {labels.common.retry}
                  </Button>
                }
              />
            ) : isLoading ? (
              <div className="text-center py-8 text-gray-500">
                {labels.common.loading}
              </div>
            ) : appointments?.appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {pageLabels.empty}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments?.appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[80px]">
                        <p className="text-lg font-semibold text-gray-900 tabular-nums">
                          {format(new Date(apt.startTime), "HH:mm")}
                        </p>
                        <p className="text-xs text-gray-400">
                          ~ {format(new Date(apt.endTime), "HH:mm")}
                        </p>
                      </div>

                      <div className="border-l pl-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <Link
                            href={`/patients/${apt.patient.id}`}
                            className="font-medium hover:underline"
                          >
                            {apt.patient.lastName} {apt.patient.firstName}
                          </Link>
                          <span className="text-xs text-gray-500">
                            ({apt.patient.patientNumber})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            担当:{" "}
                            <Link
                              href={`/staff/${apt.doctor.id}`}
                              className="hover:underline"
                            >
                              {apt.doctor.name}
                            </Link>
                          </p>
                        </div>
                        {apt.reason && (
                          <p className="text-xs text-gray-500 mt-1">
                            {apt.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {apt.isOnline && <OnlineBadge />}
                      <StatusBadge status={apt.status} />

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
                          {pageLabels.actions.checkIn}
                        </Button>
                      )}
                      {apt.status === "WAITING" && (
                        apt.isOnline ? (
                          <Button
                            size="sm"
                            onClick={() => handleStartOnlineConsultation(apt.id)}
                            disabled={startingSessionId === apt.id}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            {startingSessionId === apt.id
                              ? pageLabels.actions.preparing
                              : pageLabels.actions.startOnline}
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
                            {pageLabels.actions.start}
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
                          {pageLabels.actions.complete}
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
