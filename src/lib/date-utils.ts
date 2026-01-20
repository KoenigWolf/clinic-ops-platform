/**
 * 日付範囲ユーティリティ
 * Prisma クエリで使用する日付フィルタ用
 */

/**
 * 本日の日付範囲を取得（0:00:00 〜 翌日0:00:00）
 */
export function getTodayRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { gte: today, lt: tomorrow };
}

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

/**
 * 指定日数前からの範囲を取得
 */
export function getDaysAgoRange(days: number) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

/**
 * 今日の開始時刻を取得
 */
export function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 今日の終了時刻を取得
 */
export function getEndOfToday() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}
