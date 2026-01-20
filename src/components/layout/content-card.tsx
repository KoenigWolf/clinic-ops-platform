"use client";

import { componentStyles } from "@/lib/design-tokens";

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
    ? componentStyles.card.divided
    : componentStyles.card.base;

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
    ? componentStyles.listItem.compact
    : interactive
      ? componentStyles.listItem.interactive
      : componentStyles.listItem.base;

  return <div className={`${itemClass} ${className}`}>{children}</div>;
}
