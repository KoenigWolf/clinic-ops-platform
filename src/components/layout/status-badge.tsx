"use client";

import {
  componentStyles,
  appointmentStatusConfig,
  colors,
} from "@/lib/design-tokens";

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const config = appointmentStatusConfig[status] ?? {
    label: status,
    dot: colors.status.inactive.dot,
    text: colors.status.inactive.text,
  };

  return (
    <span className={`${componentStyles.badge.base} ${config.text}`}>
      {showDot && (
        <span className={`${componentStyles.statusDot.base} ${config.dot}`} />
      )}
      {config.label}
    </span>
  );
}

export function OnlineBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm ${colors.text.subtle} ${className}`}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      オンライン
    </span>
  );
}

interface GenericStatusBadgeProps {
  label: string;
  variant: "success" | "warning" | "error" | "info" | "neutral";
}

export function GenericStatusBadge({ label, variant }: GenericStatusBadgeProps) {
  const variantStyles = {
    success: `${colors.success.bgLight} ${colors.success.text}`,
    warning: `${colors.warning.bgLight} ${colors.warning.text}`,
    error: `${colors.error.bgLight} ${colors.error.text}`,
    info: `${colors.info.bgLight} ${colors.info.text}`,
    neutral: `${colors.bg.muted} ${colors.text.muted}`,
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}
