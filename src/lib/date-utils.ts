import { format, formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

// =============================================================================
// Date Range Utilities (for Prisma queries)
// =============================================================================

/**
 * 指定日の日付範囲を取得（0:00:00 〜 23:59:59）
 */
export function getDateRange(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { gte: startOfDay, lte: endOfDay };
}

/**
 * 今月の日付範囲を取得
 */
export function getMonthRange(date: Date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

// =============================================================================
// Date Formatting Utilities
// =============================================================================

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

/**
 * 日付をフォーマット: "2024年1月15日"
 */
export function formatDate(input: DateInput): string {
  return format(toDate(input), "yyyy年M月d日", { locale: ja });
}

/**
 * 日付を短縮フォーマット: "1月15日"
 */
export function formatDateShort(input: DateInput): string {
  return format(toDate(input), "M月d日", { locale: ja });
}

/**
 * 日付と曜日をフォーマット: "1月15日(月)"
 */
export function formatDateWithDay(input: DateInput): string {
  return format(toDate(input), "M月d日(E)", { locale: ja });
}

/**
 * 日付と時刻をフォーマット: "2024年1月15日 14:30"
 */
export function formatDateTime(input: DateInput): string {
  return format(toDate(input), "yyyy年M月d日 HH:mm", { locale: ja });
}

/**
 * 時刻のみをフォーマット: "14:30"
 */
export function formatTime(input: DateInput): string {
  return format(toDate(input), "HH:mm");
}

/**
 * 相対時間をフォーマット: "3日前", "1時間前"
 */
export function formatRelative(input: DateInput): string {
  return formatDistanceToNow(toDate(input), { addSuffix: true, locale: ja });
}
