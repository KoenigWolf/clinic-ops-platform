"use client";

import { useMemo } from "react";
import { format } from "date-fns";
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
import { labels } from "@/lib/labels";

const DAY_SLOT_HEIGHT = SLOT_HEIGHT.day;
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

interface DayScheduleProps {
  date: Date;
  appointments: Appointment[];
  onSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export function DaySchedule({
  date,
  appointments,
  onSlotClick,
  onAppointmentClick,
}: DayScheduleProps) {
  const dayAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      );
    });
  }, [appointments, date]);

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* ヘッダー */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
        <div className="text-lg font-bold text-slate-800">
          {format(date, "yyyy年M月d日 (EEEE)", { locale: ja })}
        </div>
        <div className="text-sm text-slate-500 mt-0.5">
          {pageLabels.schedule.appointmentCount(dayAppointments.length)}
        </div>
      </div>

      {/* タイムグリッド */}
      <div className="grid grid-cols-[80px_1fr] overflow-auto max-h-[700px]">
        {/* 時間列 */}
        <div className="border-r border-slate-200 bg-slate-50">
          {TIME_SLOTS.map((time) => {
            const isHour = time.endsWith(":00");
            const isHalf = time.endsWith(":30");
            return (
              <div
                key={time}
                className={cn(
                  "h-8 flex items-center justify-end pr-3 border-b",
                  isHour && "bg-slate-100 border-slate-300",
                  isHalf && "border-slate-200",
                  !isHour && !isHalf && "border-slate-100"
                )}
              >
                <span
                  className={cn(
                    "text-sm tabular-nums",
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

        {/* 予約エリア */}
        <div className="relative">
          {TIME_SLOTS.map((time) => {
            const isHour = time.endsWith(":00");
            const isHalf = time.endsWith(":30");
            return (
              <div
                key={time}
                className={cn(
                  "h-8 cursor-pointer transition-colors hover:bg-blue-50/50 border-b",
                  isHour && "bg-slate-50/50 border-slate-300",
                  isHalf && "border-slate-200",
                  !isHour && !isHalf && "border-slate-100"
                )}
                onClick={() => onSlotClick(date, time)}
              />
            );
          })}

          {/* 予約カード */}
          {dayAppointments.map((apt) => {
            const top = getTimePosition(apt.startTime) * DAY_SLOT_HEIGHT;
            const height = getAppointmentHeight(apt.startTime, apt.endTime, DAY_SLOT_HEIGHT);
            const startTime = format(new Date(apt.startTime), "HH:mm");
            const endTime = format(new Date(apt.endTime), "HH:mm");

            return (
              <div
                key={apt.id}
                className={cn(
                  "absolute left-2 right-2 rounded-lg border-l-4 px-3 py-2 cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:z-10",
                  APPOINTMENT_STATUS_COLORS[apt.status] || APPOINTMENT_STATUS_COLORS.SCHEDULED
                )}
                style={{ top: `${top}px`, height: `${Math.max(height - 4, 28)}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick(apt);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold truncate">
                      {apt.patient.lastName} {apt.patient.firstName}
                    </span>
                    {apt.isOnline && (
                      <Video className="h-4 w-4 shrink-0 opacity-70" />
                    )}
                  </div>
                  <span className="text-sm tabular-nums shrink-0 opacity-70">
                    {startTime} - {endTime}
                  </span>
                </div>
                {height >= 56 && (
                  <div className="text-sm opacity-60 truncate mt-1">
                    {apt.doctor.name} / {apt.patient.patientNumber}
                  </div>
                )}
                {height >= 80 && apt.reason && (
                  <div className="text-sm opacity-50 truncate mt-1">
                    {apt.reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
