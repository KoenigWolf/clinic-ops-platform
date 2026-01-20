export const colors = {
  bg: {
    page: "bg-gray-100",
    card: "bg-white",
    hover: "bg-gray-50/50",
    muted: "bg-gray-50",
    dark: "bg-gray-900",
  },

  text: {
    primary: "text-gray-900",
    secondary: "text-gray-600",
    muted: "text-gray-500",
    subtle: "text-gray-400",
    inverse: "text-white",
  },

  border: {
    default: "border-gray-200",
    light: "border-gray-100",
    dark: "border-gray-300",
  },

  success: {
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
  },

  warning: {
    bg: "bg-amber-400",
    bgLight: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },

  error: {
    bg: "bg-red-500",
    bgLight: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
  },

  info: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },

  status: {
    active: {
      dot: "bg-emerald-500",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    pending: {
      dot: "bg-amber-400",
      text: "text-amber-600",
      bg: "bg-amber-50",
    },
    inactive: {
      dot: "bg-gray-300",
      text: "text-gray-500",
      bg: "bg-gray-50",
    },
  },
} as const;

export const typography = {
  pageTitle: `text-lg font-medium ${colors.text.primary}`,
  sectionHeader: `text-[13px] font-medium ${colors.text.muted} uppercase tracking-wide`,
  cardTitle: `text-sm font-medium ${colors.text.primary}`,
  body: `text-sm ${colors.text.secondary}`,
  bodySmall: `text-xs ${colors.text.muted}`,
  label: `text-sm ${colors.text.muted}`,
  labelSmall: `text-xs ${colors.text.subtle}`,
  statValue: "text-2xl font-semibold tracking-tight",
  statValueLarge: "text-3xl font-semibold tracking-tight",
  time: `text-lg font-semibold ${colors.text.primary} tabular-nums`,
  timeSmall: `text-xs ${colors.text.subtle}`,
  link: `${colors.text.subtle} hover:${colors.text.secondary} transition-colors`,
} as const;

export const spacing = {
  page: {
    padding: "p-8",
    maxWidth: "max-w-5xl",
    gap: "gap-6",
  },
  section: {
    marginBottom: "mb-8",
    gap: "gap-4",
  },
  card: {
    padding: "p-5",
    paddingCompact: "p-4",
    paddingTight: "p-3",
    gap: "gap-3",
  },
  grid: {
    cols2: "grid-cols-2",
    cols3: "grid-cols-3",
    cols4: "lg:grid-cols-4",
    cols5: "lg:grid-cols-5",
  },
} as const;

export const shadows = {
  none: "",
  sm: "shadow-sm",
  default: "shadow",
  md: "shadow-md",
  lg: "shadow-lg",
} as const;

export const radius = {
  none: "rounded-none",
  sm: "rounded-sm",
  default: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
} as const;

export const transitions = {
  colors: "transition-colors",
  shadow: "transition-shadow",
  all: "transition-all",
} as const;

export const componentStyles = {
  card: {
    base: `${colors.bg.card} ${radius.xl} ${shadows.sm}`,
    interactive: `${colors.bg.card} ${radius.xl} ${shadows.sm} hover:shadow ${transitions.shadow}`,
    divided: `${colors.bg.card} ${radius.xl} ${shadows.sm} divide-y ${colors.border.light}`,
  },
  listItem: {
    base: "p-4",
    interactive: `p-4 hover:${colors.bg.hover} ${transitions.colors}`,
    compact: `p-3 hover:${colors.bg.hover} ${transitions.colors}`,
  },
  emptyState: {
    container: `${colors.bg.card} ${radius.xl} ${shadows.sm} py-12 text-center`,
    text: `text-sm ${colors.text.subtle}`,
  },
  statusDot: {
    base: "w-1.5 h-1.5 rounded-full",
  },
  avatar: {
    sm: `w-8 h-8 rounded-full ${colors.bg.muted} flex items-center justify-center`,
    md: `w-9 h-9 rounded-full ${colors.bg.muted} flex items-center justify-center`,
    lg: `w-10 h-10 rounded-full ${colors.bg.muted} flex items-center justify-center`,
    text: `text-sm font-medium ${colors.text.secondary}`,
  },
  separator: {
    vertical: `w-px h-10 ${colors.border.default}`,
    horizontal: `h-px ${colors.border.default}`,
  },
  badge: {
    base: "inline-flex items-center gap-1.5 text-sm",
  },
} as const;

export const appointmentStatusConfig: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  SCHEDULED: {
    label: "予約済",
    dot: colors.status.inactive.dot,
    text: colors.status.inactive.text,
  },
  CONFIRMED: {
    label: "確認済",
    dot: "bg-gray-400",
    text: colors.status.inactive.text,
  },
  WAITING: {
    label: "待機中",
    dot: colors.status.pending.dot,
    text: colors.status.pending.text,
  },
  IN_PROGRESS: {
    label: "診療中",
    dot: colors.status.active.dot,
    text: colors.status.active.text,
  },
  COMPLETED: {
    label: "完了",
    dot: colors.status.inactive.dot,
    text: colors.status.inactive.text,
  },
  CANCELLED: {
    label: "キャンセル",
    dot: colors.status.inactive.dot,
    text: colors.status.inactive.text,
  },
  NO_SHOW: {
    label: "未来院",
    dot: colors.status.inactive.dot,
    text: colors.status.inactive.text,
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
    bg: colors.warning.bgLight,
    text: colors.warning.text,
  },
  DISPENSED: {
    label: "調剤済",
    bg: colors.success.bgLight,
    text: colors.success.text,
  },
  CANCELLED: {
    label: "取消",
    bg: colors.bg.muted,
    text: colors.text.muted,
  },
};

export const invoiceStatusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  PENDING: {
    label: "未払い",
    bg: colors.warning.bgLight,
    text: colors.warning.text,
  },
  PAID: {
    label: "支払済",
    bg: colors.success.bgLight,
    text: colors.success.text,
  },
  OVERDUE: {
    label: "延滞",
    bg: colors.error.bgLight,
    text: colors.error.text,
  },
  CANCELLED: {
    label: "取消",
    bg: colors.bg.muted,
    text: colors.text.muted,
  },
};

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getStatusStyles(
  status: "active" | "pending" | "inactive"
): { dot: string; text: string; bg: string } {
  return colors.status[status];
}
