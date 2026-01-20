"use client";

interface ContentCardProps {
  children: React.ReactNode;
  divided?: boolean;
  className?: string;
}

export function ContentCard({
  children,
  divided = false,
  className = "",
}: ContentCardProps) {
  const baseClass = divided
    ? "bg-white rounded-xl shadow-sm divide-y divide-gray-100"
    : "bg-white rounded-xl shadow-sm";

  return <div className={`${baseClass} ${className}`}>{children}</div>;
}

interface ContentCardItemProps {
  children: React.ReactNode;
  interactive?: boolean;
  compact?: boolean;
  className?: string;
}

export function ContentCardItem({
  children,
  interactive = true,
  compact = false,
  className = "",
}: ContentCardItemProps) {
  const itemClass = compact
    ? "p-3 hover:bg-gray-50/50 transition-colors"
    : interactive
      ? "p-4 hover:bg-gray-50/50 transition-colors"
      : "p-4";

  return <div className={`${itemClass} ${className}`}>{children}</div>;
}
