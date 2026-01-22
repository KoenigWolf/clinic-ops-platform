"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Phone,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  List,
  User,
  Clock,
  Video,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentDialog } from "@/components/appointments/appointment-dialog";
import { WeekSchedule } from "@/components/appointments/week-schedule";
import { DaySchedule } from "@/components/appointments/day-schedule";
import { MonthSchedule } from "@/components/appointments/month-schedule";
import { AppointmentPopover } from "@/components/appointments/appointment-popover";
import { EmptyState, PageHeader, StatusBadge } from "@/components/layout";
import { format, startOfWeek, endOfWeek, addWeeks, addDays, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { labels } from "@/lib/labels";
import { AppointmentStatus } from "@/lib/domain/appointment-status";

const { pages: { appointments: pageLabels }, messages } = labels;

type ViewMode = "list" | "day" | "week" | "month";

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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogDefaultDate, setDialogDefaultDate] = useState<Date>(new Date());
  const [dialogDefaultTime, setDialogDefaultTime] = useState<string>("09:00");
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<SelectedAppointment | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  // リストデータ（過去1ヶ月〜未来3ヶ月）
  const listStartDate = useMemo(() => addMonths(new Date(), -1), []);
  const listEndDate = useMemo(() => addMonths(new Date(), 3), []);
  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = trpc.appointment.listByDateRange.useQuery(
    { startDate: listStartDate, endDate: listEndDate },
    { enabled: viewMode === "list" }
  );

  // 日間データ
  const {
    data: dayData,
    isLoading: isDayLoading,
    isError: isDayError,
    refetch: refetchDay,
  } = trpc.appointment.list.useQuery(
    { date: selectedDate },
    { enabled: viewMode === "day" }
  );

  // 週間データ
  const {
    data: weekData,
    isLoading: isWeekLoading,
    isError: isWeekError,
    refetch: refetchWeek,
  } = trpc.appointment.listByDateRange.useQuery(
    { startDate: weekStart, endDate: weekEnd },
    { enabled: viewMode === "week" }
  );

  // 月間データ
  const {
    data: monthData,
    isLoading: isMonthLoading,
    isError: isMonthError,
    refetch: refetchMonth,
  } = trpc.appointment.listByDateRange.useQuery(
    { startDate: monthStart, endDate: monthEnd },
    { enabled: viewMode === "month" }
  );

  const refetch = viewMode === "list" ? refetchList : viewMode === "day" ? refetchDay : viewMode === "week" ? refetchWeek : refetchMonth;

  const updateStatusMutation = trpc.appointment.updateStatus.useMutation({
    onError: () => toast.error(messages.error.appointmentUpdateFailed),
    onSuccess: (_, variables) => {
      refetch();
      // ポップオーバーを開いたまま、選択中の予約のステータスを更新
      if (selectedAppointment && selectedAppointment.id === variables.id) {
        setSelectedAppointment({ ...selectedAppointment, status: variables.status });
      }
    },
  });

  const createSessionMutation = trpc.video.createSession.useMutation();
  const getTokenMutation = trpc.video.getToken.useMutation();
  const startSessionMutation = trpc.video.startSession.useMutation();

  const handleStartOnlineConsultation = async (appointmentId: string) => {
    setStartingSessionId(appointmentId);
    setIsPopoverOpen(false);
    try {
      await updateStatusMutation.mutateAsync({ id: appointmentId, status: AppointmentStatus.IN_PROGRESS });
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

  const handleNavigate = (direction: "prev" | "next" | "today") => {
    if (viewMode === "day") {
      if (direction === "today") {
        setSelectedDate(new Date());
      } else {
        setSelectedDate((prev) => addDays(prev, direction === "next" ? 1 : -1));
      }
    } else if (viewMode === "week") {
      if (direction === "today") {
        setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
      } else {
        setWeekStart((prev) => addWeeks(prev, direction === "next" ? 1 : -1));
      }
    } else if (viewMode === "month") {
      if (direction === "today") {
        setCurrentMonth(new Date());
      } else {
        setCurrentMonth((prev) => addMonths(prev, direction === "next" ? 1 : -1));
      }
    }
  };

  const currentTitle = useMemo(() => {
    if (viewMode === "list") {
      return `予約一覧 (${listData?.length ?? 0}件)`;
    } else if (viewMode === "day") {
      return format(selectedDate, "yyyy年M月d日 (EEEE)", { locale: ja });
    } else if (viewMode === "week") {
      const end = endOfWeek(weekStart, { weekStartsOn: 1 });
      return `${format(weekStart, "yyyy年M月d日", { locale: ja })} - ${format(end, "M月d日", { locale: ja })}`;
    } else {
      return format(currentMonth, "yyyy年M月", { locale: ja });
    }
  }, [viewMode, selectedDate, weekStart, currentMonth, listData?.length]);

  const todayLabel = useMemo(() => {
    if (viewMode === "day") return pageLabels.navigation.today;
    if (viewMode === "week") return pageLabels.navigation.thisWeek;
    return pageLabels.navigation.thisMonth;
  }, [viewMode]);

  const showNavigation = viewMode !== "list";

  const isLoading = viewMode === "list" ? isListLoading : viewMode === "day" ? isDayLoading : viewMode === "week" ? isWeekLoading : isMonthLoading;
  const isError = viewMode === "list" ? isListError : viewMode === "day" ? isDayError : viewMode === "week" ? isWeekError : isMonthError;

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
                <TabsTrigger value="day" className="gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{pageLabels.viewMode.day}</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">{pageLabels.viewMode.week}</span>
                </TabsTrigger>
                <TabsTrigger value="month" className="gap-1.5">
                  <CalendarRange className="h-4 w-4" />
                  <span className="hidden sm:inline">{pageLabels.viewMode.month}</span>
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

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{currentTitle}</h2>
        {showNavigation && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate("today")}
            >
              {todayLabel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* スケジュール表示 */}
      {isError ? (
        <EmptyState message={labels.common.loadFailed} onRetry={refetch} />
      ) : isLoading ? (
        <Card>
          <CardContent className="p-4">
            {viewMode === "month" ? (
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
          {!listData || listData.length === 0 ? (
            <div className="p-8">
              <EmptyState message={pageLabels.empty} icon={CalendarIcon} />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {listData.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  onClick={() => handleAppointmentClick(apt)}
                >
                  <div className="flex items-center gap-4">
                    {/* 日付・時間 */}
                    <div className="text-center min-w-[100px] border-r pr-4">
                      <p className="text-sm font-medium text-slate-600">
                        {format(new Date(apt.startTime), "M/d (E)", { locale: ja })}
                      </p>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">
                        {format(new Date(apt.startTime), "HH:mm")}
                      </p>
                      <p className="text-xs text-slate-400">
                        〜 {format(new Date(apt.endTime), "HH:mm")}
                      </p>
                    </div>

                    {/* 患者情報 */}
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <Link
                          href={`/patients/${apt.patient.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {apt.patient.lastName} {apt.patient.firstName}
                        </Link>
                        <span className="text-xs text-slate-500 font-mono">
                          {apt.patient.patientNumber}
                        </span>
                        {apt.isOnline && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            <Video className="h-3 w-3" />
                            オンライン
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {pageLabels.doctorLabel}{" "}
                          <Link
                            href={`/staff/${apt.doctor.id}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {apt.doctor.name}
                          </Link>
                        </span>
                      </div>
                      {apt.reason && (
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-md">
                          {apt.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ステータス・アクション */}
                  <div className="flex items-center gap-3">
                    <StatusBadge status={apt.status} />

                    {apt.status === AppointmentStatus.SCHEDULED && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({ id: apt.id, status: AppointmentStatus.WAITING });
                        }}
                      >
                        {pageLabels.actions.checkIn}
                      </Button>
                    )}
                    {apt.status === AppointmentStatus.WAITING && apt.isOnline && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartOnlineConsultation(apt.id);
                        }}
                        disabled={startingSessionId === apt.id}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {startingSessionId === apt.id ? pageLabels.actions.preparing : pageLabels.actions.startOnline}
                      </Button>
                    )}
                    {apt.status === AppointmentStatus.WAITING && !apt.isOnline && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({ id: apt.id, status: AppointmentStatus.IN_PROGRESS });
                        }}
                      >
                        {pageLabels.actions.start}
                      </Button>
                    )}
                    {apt.status === AppointmentStatus.IN_PROGRESS && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({ id: apt.id, status: AppointmentStatus.COMPLETED });
                        }}
                      >
                        {pageLabels.actions.complete}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === "day" ? (
        <DaySchedule
          date={selectedDate}
          appointments={dayData?.appointments || []}
          onSlotClick={handleSlotClick}
          onAppointmentClick={handleAppointmentClick}
        />
      ) : viewMode === "week" ? (
        <WeekSchedule
          weekStart={weekStart}
          appointments={weekData || []}
          onSlotClick={handleSlotClick}
          onAppointmentClick={handleAppointmentClick}
        />
      ) : (
        <MonthSchedule
          month={currentMonth}
          appointments={monthData || []}
          onDateClick={(date) => {
            setSelectedDate(date);
            setViewMode("day");
          }}
          onAppointmentClick={handleAppointmentClick}
        />
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
