"use client";

import { typography, componentStyles } from "@/lib/design-tokens";

interface TimeDisplayProps {
  startTime: Date | string;
  endTime?: Date | string;
  className?: string;
}

export function TimeDisplay({
  startTime,
  endTime,
  className = "",
}: TimeDisplayProps) {
  const formatTime = (time: Date | string) => {
    const date = typeof time === "string" ? new Date(time) : time;
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`text-center min-w-[52px] ${className}`}>
      <p className={typography.time}>{formatTime(startTime)}</p>
      {endTime && <p className={typography.timeSmall}>{formatTime(endTime)}</p>}
    </div>
  );
}

interface DateDisplayProps {
  date: Date | string;
  format?: "short" | "long";
  className?: string;
}

export function DateDisplay({
  date,
  format = "short",
  className = "",
}: DateDisplayProps) {
  const d = typeof date === "string" ? new Date(date) : date;

  const formatted =
    format === "short"
      ? d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
      : d.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
        });

  return (
    <span className={`${typography.labelSmall} tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}

export function VerticalSeparator({ className = "" }: { className?: string }) {
  return <div className={`${componentStyles.separator.vertical} ${className}`} />;
}
