"use client";

import { appointmentStatusConfig } from "@/lib/design-tokens";

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const config = appointmentStatusConfig[status] ?? {
    label: status,
    dot: "bg-gray-300",
    text: "text-gray-500",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${config.text}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      {config.label}
    </span>
  );
}

export function OnlineBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-sm text-gray-400 ${className}`}>
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

const variantStyles = {
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-red-50 text-red-600",
  info: "bg-blue-50 text-blue-600",
  neutral: "bg-gray-50 text-gray-500",
};

export function GenericStatusBadge({ label, variant }: GenericStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantStyles[variant]}`}>
      {label}
    </span>
  );
}
