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
