"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Video } from "lucide-react";
import { APPOINTMENT_STATUS_COLORS_COMPACT } from "@/lib/appointment-config";
import { labels } from "@/lib/labels";

const { pages: { appointments: pageLabels } } = labels;

type Appointment = {
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

interface MonthScheduleProps {
  month: Date;
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export function MonthSchedule({
  month,
  appointments,
  onDateClick,
  onAppointmentClick,
}: MonthScheduleProps) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let currentDay = calendarStart;
    while (currentDay <= calendarEnd) {
      days.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }
    return days;
  }, [month]);

  const appointmentsByDay = useMemo(() => {
    const byDay: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      const key = format(new Date(apt.startTime), "yyyy-MM-dd");
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(apt);
    });
    // Sort by start time
    Object.keys(byDay).forEach((key) => {
      byDay[key].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });
    return byDay;
  }, [appointments]);

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* ヘッダー: 曜日 */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              "py-3 text-center text-sm font-semibold border-r last:border-r-0 border-slate-200",
              index === 5 && "text-blue-600",
              index === 6 && "text-red-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayAppointments = appointmentsByDay[dayKey] || [];
          const isCurrentMonth = isSameMonth(day, month);
          const isDayToday = isToday(day);
          const dayOfWeek = (index % 7);
          const isSaturday = dayOfWeek === 5;
          const isSunday = dayOfWeek === 6;

          return (
            <div
              key={dayKey}
              className={cn(
                "min-h-[120px] border-r border-b border-slate-200 last:border-r-0 p-1 cursor-pointer transition-colors hover:bg-slate-50/50",
                !isCurrentMonth && "bg-slate-50/50"
              )}
              onClick={() => onDateClick(day)}
            >
              {/* 日付 */}
              <div className="flex items-center justify-center mb-1">
                <span
                  className={cn(
                    "w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full",
                    isDayToday && "bg-blue-500 text-white",
                    !isDayToday && isCurrentMonth && "text-slate-700",
                    !isDayToday && !isCurrentMonth && "text-slate-400",
                    !isDayToday && isSaturday && isCurrentMonth && "text-blue-600",
                    !isDayToday && isSunday && isCurrentMonth && "text-red-500"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* 予約リスト */}
              <div className="space-y-0.5">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-all hover:opacity-80",
                      APPOINTMENT_STATUS_COLORS_COMPACT[apt.status] || APPOINTMENT_STATUS_COLORS_COMPACT.SCHEDULED
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(apt);
                    }}
                  >
                    <span className="font-medium tabular-nums">
                      {format(new Date(apt.startTime), "HH:mm")}
                    </span>{" "}
                    <span className="opacity-80">
                      {apt.patient.lastName}
                    </span>
                    {apt.isOnline && (
                      <Video className="inline-block h-3 w-3 ml-0.5 opacity-70" />
                    )}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-slate-500 text-center py-0.5">
                    {pageLabels.schedule.moreAppointments(dayAppointments.length - 3)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
