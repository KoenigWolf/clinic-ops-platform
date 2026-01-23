"use client";

import { useMemo } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Video } from "lucide-react";
import {
  TIME_SLOTS,
  SLOT_HEIGHT,
  APPOINTMENT_STATUS_COLORS,
  getTimePosition,
  getAppointmentHeight,
} from "@/lib/appointment-config";
import type { AppointmentView } from "@/lib/domain/appointment";

const WEEK_SLOT_HEIGHT = SLOT_HEIGHT.week;
const TIME_COLUMN_WIDTH = "72px";

interface WeekScheduleProps {
  weekStart: Date;
  appointments: AppointmentView[];
  onSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: AppointmentView) => void;
}

export function WeekSchedule({
  weekStart,
  appointments,
  onSlotClick,
  onAppointmentClick,
}: WeekScheduleProps) {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const today = new Date();

  const appointmentsByDay = useMemo(() => {
    const byDay: Record<string, AppointmentView[]> = {};
    days.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      byDay[key] = appointments.filter((apt) =>
        isSameDay(new Date(apt.startTime), day)
      );
    });
    return byDay;
  }, [appointments, days]);

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* ヘッダー: 曜日 */}
      <div
        className="grid border-b bg-slate-50"
        style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH} repeat(7, 1fr)` }}
      >
        <div className="p-3 border-r border-slate-200 bg-slate-100" />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "py-3 px-2 text-center border-r border-slate-200 last:border-r-0",
                isToday && "bg-blue-50"
              )}
            >
              <div className={cn(
                "text-xs font-medium",
                isToday ? "text-blue-600" : "text-slate-500"
              )}>
                {format(day, "E", { locale: ja })}
              </div>
              <div className={cn(
                "text-lg font-bold mt-0.5",
                isToday ? "text-blue-600" : "text-slate-800"
              )}>
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* タイムグリッド */}
      <div
        className="grid overflow-auto max-h-[700px]"
        style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH} repeat(7, 1fr)` }}
      >
        {/* 時間列 */}
        <div className="border-r border-slate-200 bg-slate-50">
          {TIME_SLOTS.map((time) => {
            const isHour = time.endsWith(":00");
            const isHalf = time.endsWith(":30");
            return (
              <div
                key={time}
                className={cn(
                  "h-7 flex items-center justify-end pr-3 border-b",
                  isHour && "bg-slate-100 border-slate-300",
                  isHalf && "border-slate-200",
                  !isHour && !isHalf && "border-slate-100"
                )}
              >
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    isHour && "text-slate-700 font-semibold",
                    isHalf && "text-slate-500 font-medium",
                    !isHour && !isHalf && "text-slate-400"
                  )}
                >
                  {time}
                </span>
              </div>
            );
          })}
        </div>

        {/* 日付列 */}
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayAppointments = appointmentsByDay[dayKey] || [];
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative border-r border-slate-200 last:border-r-0",
                isToday && "bg-blue-50/40"
              )}
            >
              {TIME_SLOTS.map((time) => {
                const isHour = time.endsWith(":00");
                const isHalf = time.endsWith(":30");
                return (
                  <div
                    key={time}
                    className={cn(
                      "h-7 cursor-pointer transition-colors hover:bg-blue-50/50 border-b",
                      isHour && "bg-slate-50/50 border-slate-300",
                      isHalf && "border-slate-200",
                      !isHour && !isHalf && "border-slate-100"
                    )}
                    onClick={() => onSlotClick(day, time)}
                  />
                );
              })}

              {dayAppointments.map((apt) => {
                const top = getTimePosition(apt.startTime) * WEEK_SLOT_HEIGHT;
                const height = getAppointmentHeight(apt.startTime, apt.endTime, WEEK_SLOT_HEIGHT);
                const startTime = format(new Date(apt.startTime), "HH:mm");

                return (
                  <div
                    key={apt.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:z-10 hover:scale-[1.02]",
                      APPOINTMENT_STATUS_COLORS[apt.status] || APPOINTMENT_STATUS_COLORS.SCHEDULED
                    )}
                    style={{ top: `${top}px`, height: `${Math.max(height - 2, 24)}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(apt);
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate">
                        {apt.patient.lastName}
                      </span>
                      {apt.isOnline && (
                        <Video className="h-3 w-3 shrink-0 opacity-70" />
                      )}
                    </div>
                    {height >= 52 && (
                      <div className="text-xs opacity-60 truncate mt-0.5">
                        {startTime}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
