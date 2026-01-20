"use client";

import { useMemo } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Video } from "lucide-react";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

const SLOT_HEIGHT = 48;

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-gray-100 border-gray-300 text-gray-700",
  CONFIRMED: "bg-blue-50 border-blue-300 text-blue-700",
  WAITING: "bg-amber-50 border-amber-300 text-amber-700",
  IN_PROGRESS: "bg-green-50 border-green-300 text-green-700",
  COMPLETED: "bg-gray-50 border-gray-200 text-gray-500",
  CANCELLED: "bg-red-50 border-red-200 text-red-400 line-through",
  NO_SHOW: "bg-red-50 border-red-200 text-red-400",
};

type Appointment = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  isOnline: boolean;
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

interface WeekScheduleProps {
  weekStart: Date;
  appointments: Appointment[];
  onSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

function getTimePosition(time: Date | string): number {
  const d = new Date(time);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const startHour = 9;
  const slotMinutes = 30;
  return ((hours - startHour) * 60 + minutes) / slotMinutes;
}

function getAppointmentHeight(start: Date | string, end: Date | string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  return (durationMinutes / 30) * SLOT_HEIGHT;
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
    const byDay: Record<string, Appointment[]> = {};
    days.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      byDay[key] = appointments.filter((apt) =>
        isSameDay(new Date(apt.startTime), day)
      );
    });
    return byDay;
  }, [appointments, days]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-gray-50">
        <div className="p-2 border-r" />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 text-center border-r last:border-r-0",
                isToday && "bg-blue-50"
              )}
            >
              <div className={cn(
                "text-xs",
                isToday ? "text-blue-600" : "text-gray-500"
              )}>
                {format(day, "E", { locale: ja })}
              </div>
              <div className={cn(
                "text-sm font-semibold",
                isToday ? "text-blue-600" : "text-gray-900"
              )}>
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[60px_repeat(7,1fr)] overflow-auto max-h-[600px]">
        <div className="border-r">
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className="h-12 border-b last:border-b-0 px-2 flex items-start justify-end pt-1"
            >
              <span className="text-xs text-gray-400 tabular-nums">{time}</span>
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayAppointments = appointmentsByDay[dayKey] || [];
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative border-r last:border-r-0",
                isToday && "bg-blue-50/30"
              )}
            >
              {TIME_SLOTS.map((time) => (
                <div
                  key={time}
                  className="h-12 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSlotClick(day, time)}
                />
              ))}

              {dayAppointments.map((apt) => {
                const top = getTimePosition(apt.startTime) * SLOT_HEIGHT;
                const height = getAppointmentHeight(apt.startTime, apt.endTime);
                const startTime = format(new Date(apt.startTime), "HH:mm");

                return (
                  <div
                    key={apt.id}
                    className={cn(
                      "absolute left-0.5 right-0.5 rounded border px-1 py-0.5 cursor-pointer overflow-hidden transition-shadow hover:shadow-md hover:z-10",
                      statusColors[apt.status] || statusColors.SCHEDULED
                    )}
                    style={{ top: `${top}px`, height: `${Math.max(height - 2, 20)}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppointmentClick(apt);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium truncate">
                        {apt.patient.lastName}
                      </span>
                      {apt.isOnline && (
                        <Video className="h-3 w-3 shrink-0" />
                      )}
                    </div>
                    {height >= 40 && (
                      <div className="text-xs opacity-75 truncate">
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
