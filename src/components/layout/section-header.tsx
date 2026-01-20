"use client";

import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel = "すべて表示",
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">{title}</h2>
      {viewAllHref && (
        <Link href={viewAllHref} className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
          {viewAllLabel}
        </Link>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
