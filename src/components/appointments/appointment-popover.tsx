"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { StatusBadge } from "@/components/layout";
import {
  User,
  Clock,
  Calendar,
  FileText,
  Phone,
  Video,
  Stethoscope,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { labels } from "@/lib/labels";
import {
  AppointmentStatus,
  getRevertStatus,
  canCancel,
  shouldShowActions,
  type AppointmentStatusType,
} from "@/lib/domain/appointment-status";

const { pages: { appointments: pageLabels } } = labels;
const { detail: detailLabels } = pageLabels;

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

interface AppointmentPopoverProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: AppointmentStatusType) => void;
  onStartOnline: (id: string) => void;
  isUpdating: boolean;
  isStartingSession: boolean;
}

type StatusStep = {
  key: string;
  labelKey: keyof typeof detailLabels.statusTimeline;
  icon: LucideIcon;
};

const statusSteps: StatusStep[] = [
  { key: "SCHEDULED", labelKey: "scheduled", icon: Calendar },
  { key: "WAITING", labelKey: "waiting", icon: Clock },
  { key: "IN_PROGRESS", labelKey: "inProgress", icon: Stethoscope },
  { key: "COMPLETED", labelKey: "completed", icon: CheckCircle2 },
];

function getStatusIndex(status: string): number {
  if (status === AppointmentStatus.CANCELLED || status === AppointmentStatus.NO_SHOW) return -1;
  const idx = statusSteps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = getStatusIndex(currentStatus);
  const isCancelledOrNoShow = currentStatus === AppointmentStatus.CANCELLED || currentStatus === AppointmentStatus.NO_SHOW;

  if (isCancelledOrNoShow) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 px-3 bg-red-50 rounded-lg">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="text-sm font-medium text-red-600">
          {currentStatus === AppointmentStatus.CANCELLED
            ? detailLabels.statusTimeline.cancelled
            : detailLabels.statusTimeline.noShow}
        </span>
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all
                    ${isCompleted ? "bg-emerald-500 text-white" : ""}
                    ${isCurrent ? "bg-blue-500 text-white ring-4 ring-blue-100" : ""}
                    ${isPending ? "bg-gray-100 text-gray-400" : ""}
                  `}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`
                    text-xs mt-1.5 font-medium whitespace-nowrap
                    ${isCompleted ? "text-emerald-600" : ""}
                    ${isCurrent ? "text-blue-600" : ""}
                    ${isPending ? "text-gray-400" : ""}
                  `}
                >
                  {detailLabels.statusTimeline[step.labelKey]}
                </span>
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 mt-[-18px]
                    ${index < currentIndex ? "bg-emerald-500" : "bg-gray-200"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 戻るラベルのマッピング */
const REVERT_LABELS: Record<AppointmentStatusType, string> = {
  [AppointmentStatus.SCHEDULED]: pageLabels.actions.revertToScheduled,
  [AppointmentStatus.WAITING]: pageLabels.actions.revertToWaiting,
  [AppointmentStatus.IN_PROGRESS]: pageLabels.actions.revertToInProgress,
  [AppointmentStatus.COMPLETED]: "", // 使用されない
  [AppointmentStatus.CANCELLED]: pageLabels.actions.revertCancellation,
  [AppointmentStatus.NO_SHOW]: "", // 使用されない
};

/** 進むアクションボタン */
function ForwardActions({
  appointment,
  onStatusChange,
  onStartOnline,
  isUpdating,
  isStartingSession,
}: {
  appointment: Appointment;
  onStatusChange: (id: string, status: AppointmentStatusType) => void;
  onStartOnline: (id: string) => void;
  isUpdating: boolean;
  isStartingSession: boolean;
}) {
  const { status, id, isOnline } = appointment;

  if (status === AppointmentStatus.SCHEDULED) {
    return (
      <Button
        className="w-full h-12 text-base"
        onClick={() => onStatusChange(id, AppointmentStatus.WAITING)}
        disabled={isUpdating}
      >
        <Clock className="h-5 w-5 mr-2" />
        {pageLabels.actions.checkIn}
      </Button>
    );
  }

  if (status === AppointmentStatus.WAITING) {
    return isOnline ? (
      <Button
        className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
        onClick={() => onStartOnline(id)}
        disabled={isStartingSession}
      >
        <Phone className="h-5 w-5 mr-2" />
        {isStartingSession ? pageLabels.actions.preparing : pageLabels.actions.startOnline}
      </Button>
    ) : (
      <Button
        className="w-full h-12 text-base"
        onClick={() => onStatusChange(id, AppointmentStatus.IN_PROGRESS)}
        disabled={isUpdating}
      >
        <Stethoscope className="h-5 w-5 mr-2" />
        {pageLabels.actions.start}
      </Button>
    );
  }

  if (status === AppointmentStatus.IN_PROGRESS) {
    return (
      <Button
        className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
        onClick={() => onStatusChange(id, AppointmentStatus.COMPLETED)}
        disabled={isUpdating}
      >
        <CheckCircle2 className="h-5 w-5 mr-2" />
        {pageLabels.actions.complete}
      </Button>
    );
  }

  return null;
}

/** 戻るアクションボタン */
function RevertAction({
  appointment,
  onStatusChange,
  isUpdating,
}: {
  appointment: Appointment;
  onStatusChange: (id: string, status: AppointmentStatusType) => void;
  isUpdating: boolean;
}) {
  const revertTo = getRevertStatus(appointment.status);
  if (!revertTo) return null;

  return (
    <Button
      className="w-full"
      variant="outline"
      onClick={() => onStatusChange(appointment.id, revertTo)}
      disabled={isUpdating}
    >
      <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
      {REVERT_LABELS[revertTo]}
    </Button>
  );
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
  const patientInitials = `${appointment.patient.lastName.charAt(0)}${appointment.patient.firstName.charAt(0)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[540px] p-0 flex flex-col">
        <VisuallyHidden.Root>
          <SheetTitle>
            {appointment.patient.lastName} {appointment.patient.firstName} - {detailLabels.sections.dateTime}
          </SheetTitle>
        </VisuallyHidden.Root>
        {/* ヘッダー: 患者情報 */}
        <div className="bg-linear-to-br from-slate-50 to-slate-100 px-6 py-5 border-b">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center border">
              <span className="text-lg font-bold text-slate-600">
                {patientInitials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/patients/${appointment.patient.id}`}
                  className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors truncate"
                >
                  {appointment.patient.lastName} {appointment.patient.firstName}
                </Link>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="font-mono">{appointment.patient.patientNumber}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <StatusBadge status={appointment.status} />
              </div>
            </div>
            {appointment.isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                <Video className="h-3.5 w-3.5" />
                {detailLabels.badge.online}
              </div>
            )}
          </div>
        </div>

        {/* ステータスタイムライン */}
        <div className="px-6 py-4 border-b bg-white">
          <StatusTimeline currentStatus={appointment.status} />
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* 日時 */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500">{detailLabels.sections.dateTime}</div>
                <div className="font-semibold text-slate-900">
                  {format(startTime, "M月d日 (E)", { locale: ja })}
                  <span className="ml-2 tabular-nums">
                    {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 担当医・診療形態 (横並び) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">{detailLabels.sections.doctor}</div>
                  <Link
                    href={`/staff/${appointment.doctor.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-sm truncate block"
                  >
                    {appointment.doctor.name}
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${appointment.isOnline ? "bg-blue-100" : "bg-amber-100"}`}>
                  {appointment.isOnline ? (
                    <Video className="h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">{detailLabels.sections.consultationType}</div>
                  <span className="font-semibold text-slate-900 text-sm">
                    {appointment.isOnline
                      ? detailLabels.consultationType.online
                      : detailLabels.consultationType.inPerson}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 予約理由 */}
          {appointment.reason && (
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center shrink-0">
                  <FileText className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">{detailLabels.sections.reason}</div>
                  <p className="text-sm text-slate-700">{appointment.reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター: アクションボタン */}
        {shouldShowActions(appointment.status) && (
          <div className="border-t bg-white px-6 py-4 space-y-3">
            {/* 進むアクション: ステータスに応じた主要ボタン */}
            <ForwardActions
              appointment={appointment}
              onStatusChange={onStatusChange}
              onStartOnline={onStartOnline}
              isUpdating={isUpdating}
              isStartingSession={isStartingSession}
            />

            {/* 戻るアクション: Domain層のgetRevertStatusで判定 */}
            <RevertAction
              appointment={appointment}
              onStatusChange={onStatusChange}
              isUpdating={isUpdating}
            />

            {/* キャンセルアクション: Domain層のcanCancelで判定 */}
            {canCancel(appointment.status) && (
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => onStatusChange(appointment.id, AppointmentStatus.CANCELLED)}
                disabled={isUpdating}
              >
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                <span className="text-red-500">{pageLabels.actions.cancel}</span>
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
