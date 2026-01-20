"use client";

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
      <p className="text-lg font-semibold text-gray-900 tabular-nums">{formatTime(startTime)}</p>
      {endTime && <p className="text-xs text-gray-400">{formatTime(endTime)}</p>}
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
    <span className={`text-xs text-gray-400 tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}

export function VerticalSeparator({ className = "" }: { className?: string }) {
  return <div className={`w-px h-10 bg-gray-200 ${className}`} />;
}
