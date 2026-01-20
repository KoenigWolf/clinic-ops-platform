"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge, OnlineBadge } from "@/components/layout";
import { User, Clock, Calendar, FileText, Phone, X } from "lucide-react";
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

type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface AppointmentPopoverProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onStartOnline: (id: string) => void;
  isUpdating: boolean;
  isStartingSession: boolean;
}

export function AppointmentPopover({
  appointment,
  open,
  onOpenChange,
  onStatusChange,
  onStartOnline,
  isUpdating,
  isStartingSession,
}: AppointmentPopoverProps) {
  if (!appointment) return null;

  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            予約詳細
            <StatusBadge status={appointment.status} />
            {appointment.isOnline && <OnlineBadge />}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">患者</div>
              <Link
                href={`/patients/${appointment.patient.id}`}
                className="font-medium hover:underline"
              >
                {appointment.patient.lastName} {appointment.patient.firstName}
              </Link>
              <div className="text-sm text-gray-500">
                {appointment.patient.patientNumber}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">日時</div>
              <div className="font-medium">
                {format(startTime, "yyyy年M月d日 (E)", { locale: ja })}
              </div>
              <div className="text-sm text-gray-600">
                {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <div className="text-sm text-gray-500">担当医</div>
              <Link
                href={`/staff/${appointment.doctor.id}`}
                className="font-medium hover:underline"
              >
                {appointment.doctor.name}
              </Link>
            </div>
          </div>

          {appointment.reason && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">予約理由</div>
                <div className="text-sm">{appointment.reason}</div>
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-3">
              ステータス変更
            </div>

            {appointment.status === "SCHEDULED" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onStatusChange(appointment.id, "WAITING")}
                disabled={isUpdating}
              >
                {pageLabels.actions.checkIn}
              </Button>
            )}

            {appointment.status === "WAITING" && (
              appointment.isOnline ? (
                <Button
                  className="w-full"
                  onClick={() => onStartOnline(appointment.id)}
                  disabled={isStartingSession}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {isStartingSession ? pageLabels.actions.preparing : pageLabels.actions.startOnline}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => onStatusChange(appointment.id, "IN_PROGRESS")}
                  disabled={isUpdating}
                >
                  {pageLabels.actions.start}
                </Button>
              )
            )}

            {appointment.status === "IN_PROGRESS" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onStatusChange(appointment.id, "COMPLETED")}
                disabled={isUpdating}
              >
                {pageLabels.actions.complete}
              </Button>
            )}

            {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status) && (
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => onStatusChange(appointment.id, "CANCELLED")}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-2" />
                キャンセル
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
