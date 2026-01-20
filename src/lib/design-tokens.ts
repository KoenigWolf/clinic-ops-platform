export const sidebar = {
  bg: "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900",
  border: "border-slate-700/50",
  text: {
    primary: "text-white",
    secondary: "text-slate-300",
    muted: "text-slate-400",
    subtle: "text-slate-500",
  },
  logo: {
    bg: "bg-gradient-to-br from-teal-500 to-cyan-600",
    text: "text-white",
  },
  nav: {
    active: "bg-gradient-to-r from-teal-600/90 to-cyan-600/90 text-white shadow-lg shadow-teal-500/25",
    hover: "hover:bg-slate-700/60 hover:text-white",
    inactive: "text-slate-400",
  },
  avatar: {
    bg: "bg-gradient-to-br from-teal-500 to-cyan-600",
    ring: "ring-2 ring-teal-500/20",
  },
  toggle: "text-slate-500 hover:text-slate-300 hover:bg-slate-700/60",
} as const;

export const appointmentStatusConfig: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  SCHEDULED: {
    label: "予約済",
    dot: "bg-gray-300",
    text: "text-gray-500",
  },
  CONFIRMED: {
    label: "確認済",
    dot: "bg-gray-400",
    text: "text-gray-500",
  },
  WAITING: {
    label: "待機中",
    dot: "bg-amber-400",
    text: "text-amber-600",
  },
  IN_PROGRESS: {
    label: "診療中",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  COMPLETED: {
    label: "完了",
    dot: "bg-gray-300",
    text: "text-gray-500",
  },
  CANCELLED: {
    label: "キャンセル",
    dot: "bg-gray-300",
    text: "text-gray-500",
  },
  NO_SHOW: {
    label: "未来院",
    dot: "bg-gray-300",
    text: "text-gray-500",
  },
};

export const appointmentTypeConfig: Record<string, { label: string }> = {
  INITIAL: { label: "初診" },
  FOLLOWUP: { label: "再診" },
  CONSULTATION: { label: "相談" },
  CHECKUP: { label: "健診" },
  EMERGENCY: { label: "緊急" },
};

export const prescriptionStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  PENDING: {
    label: "未処理",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  DISPENSED: {
    label: "調剤済",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  CANCELLED: {
    label: "取消",
    bg: "bg-gray-50",
    text: "text-gray-500",
  },
};

export const invoiceStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  DRAFT: {
    label: "下書き",
    bg: "bg-gray-50",
    text: "text-gray-500",
  },
  SENT: {
    label: "送付済",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  PENDING: {
    label: "未払い",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  PAID: {
    label: "支払済",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  OVERDUE: {
    label: "延滞",
    bg: "bg-red-50",
    text: "text-red-600",
  },
  CANCELLED: {
    label: "取消",
    bg: "bg-gray-50",
    text: "text-gray-500",
  },
};
