/**
 * 予約管理の設定値（Single Source of Truth）
 *
 * 業務ルール・表示設定を一箇所に集約
 */

/** 予約スケジュールの時間スロット（10分単位） */
export const TIME_SLOTS = [
  "09:00", "09:10", "09:20", "09:30", "09:40", "09:50",
  "10:00", "10:10", "10:20", "10:30", "10:40", "10:50",
  "11:00", "11:10", "11:20", "11:30", "11:40", "11:50",
  "12:00", "12:10", "12:20", "12:30", "12:40", "12:50",
  "13:00", "13:10", "13:20", "13:30", "13:40", "13:50",
  "14:00", "14:10", "14:20", "14:30", "14:40", "14:50",
  "15:00", "15:10", "15:20", "15:30", "15:40", "15:50",
  "16:00", "16:10", "16:20", "16:30", "16:40", "16:50",
  "17:00", "17:10", "17:20", "17:30", "17:40", "17:50",
] as const;

/** 時間スロットの単位（分） */
export const SLOT_MINUTES = 10;

/** 週間/日間ビューのスロット高さ */
export const SLOT_HEIGHT = {
  week: 28,
  day: 32,
} as const;

/** 診療開始時間 */
export const START_HOUR = 9;

/** 予約ステータスの表示色（UIレイヤー用） */
export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-slate-100 border-l-slate-400 text-slate-700",
  CONFIRMED: "bg-blue-50 border-l-blue-500 text-blue-700",
  WAITING: "bg-amber-50 border-l-amber-500 text-amber-800",
  IN_PROGRESS: "bg-emerald-50 border-l-emerald-500 text-emerald-800",
  COMPLETED: "bg-slate-50 border-l-slate-300 text-slate-500",
  CANCELLED: "bg-red-50 border-l-red-300 text-red-400 line-through opacity-60",
  NO_SHOW: "bg-red-50 border-l-red-400 text-red-500",
} as const;

/** 月間ビュー用のステータス色（コンパクト版） */
export const APPOINTMENT_STATUS_COLORS_COMPACT: Record<string, string> = {
  SCHEDULED: "bg-slate-200 text-slate-700",
  CONFIRMED: "bg-blue-200 text-blue-800",
  WAITING: "bg-amber-200 text-amber-800",
  IN_PROGRESS: "bg-emerald-200 text-emerald-800",
  COMPLETED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-red-100 text-red-400 line-through",
  NO_SHOW: "bg-red-200 text-red-600",
} as const;

/** 時間位置の計算 */
export function getTimePosition(time: Date | string): number {
  const d = new Date(time);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  return ((hours - START_HOUR) * 60 + minutes) / SLOT_MINUTES;
}

/** 予約の高さ計算 */
export function getAppointmentHeight(
  start: Date | string,
  end: Date | string,
  slotHeight: number
): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  return (durationMinutes / SLOT_MINUTES) * slotHeight;
}
