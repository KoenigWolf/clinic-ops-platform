"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Clock, User, Phone, ChevronLeft, ChevronRight, List, CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentDialog } from "@/components/appointments/appointment-dialog";
import { WeekSchedule } from "@/components/appointments/week-schedule";
import { AppointmentPopover } from "@/components/appointments/appointment-popover";
import { EmptyState, OnlineBadge, PageHeader, StatusBadge } from "@/components/layout";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { labels } from "@/lib/labels";

const { pages: { appointments: pageLabels }, messages } = labels;

type ViewMode = "list" | "week";

type SelectedAppointment = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  isOnline: boolean;
  reason?: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
  };
  doctor: {
    id: string;
    name: string;
  };
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date>(new Date());
  const [dialogDefaultTime, setDialogDefaultTime] = useState<string>("09:00");
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<SelectedAppointment | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = trpc.appointment.list.useQuery(
    { date: selectedDate },
    { enabled: viewMode === "list" }
  );

  const {
    data: weekData,
    isLoading: isWeekLoading,
    isError: isWeekError,
    refetch: refetchWeek,
  } = trpc.appointment.listByDateRange.useQuery(
    { startDate: weekStart, endDate: addWeeks(weekEnd, 0) },
    { enabled: viewMode === "week" }
  );

  const refetch = viewMode === "list" ? refetchList : refetchWeek;

  const updateStatusMutation = trpc.appointment.updateStatus.useMutation({
    onError: () => toast.error(messages.error.appointmentUpdateFailed),
    onSuccess: () => {
      refetch();
      setIsPopoverOpen(false);
    },
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

  const handleSlotClick = (date: Date, time: string) => {
    setDialogDefaultDate(date);
    setDialogDefaultTime(time);
    setIsDialogOpen(true);
  };

  const handleAppointmentClick = (appointment: SelectedAppointment) => {
    setSelectedAppointment(appointment);
    setIsPopoverOpen(true);
  };

  const handleWeekChange = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else {
      setWeekStart((prev) => addWeeks(prev, direction === "next" ? 1 : -1));
    }
  };

  const dateTitle = useMemo(
    () => format(selectedDate, "yyyy年M月d日 (E)", { locale: ja }),
    [selectedDate]
  );

  const weekTitle = useMemo(() => {
    const end = endOfWeek(weekStart, { weekStartsOn: 1 });
    return `${format(weekStart, "M月d日", { locale: ja })} - ${format(end, "M月d日", { locale: ja })}`;
  }, [weekStart]);

  const isLoading = viewMode === "list" ? isListLoading : isWeekLoading;
  const isError = viewMode === "list" ? isListError : isWeekError;

  return (
    <div className="space-y-4">
      <PageHeader
        title={pageLabels.title}
        description={pageLabels.description}
        actions={
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="list" className="gap-1.5">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">{pageLabels.viewMode.list}</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">{pageLabels.viewMode.week}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={() => {
              setDialogDefaultDate(selectedDate);
              setDialogDefaultTime("09:00");
              setIsDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              {pageLabels.newAppointment}
            </Button>
          </div>
        }
      />

      {viewMode === "week" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{weekTitle}</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekChange("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekChange("today")}
              >
                {pageLabels.thisWeek}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeekChange("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

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
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-48 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <WeekSchedule
              weekStart={weekStart}
              appointments={weekData || []}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
        </div>
      ) : (
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
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-20" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : listData?.appointments.length === 0 ? (
                <EmptyState message={pageLabels.empty} icon={CalendarIcon} />
              ) : (
                <div className="space-y-4">
                  {listData?.appointments.map((apt) => (
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
                              {pageLabels.doctorLabel}{" "}
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
      )}

      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={dialogDefaultDate}
        defaultTime={dialogDefaultTime}
        onSuccess={() => {
          refetch();
          setIsDialogOpen(false);
        }}
      />

      <AppointmentPopover
        appointment={selectedAppointment}
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
        onStartOnline={handleStartOnlineConsultation}
        isUpdating={updateStatusMutation.isPending}
        isStartingSession={startingSessionId !== null}
      />
    </div>
  );
}
