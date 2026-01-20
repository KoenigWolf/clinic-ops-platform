"use client";

import Link from "next/link";
import { typography } from "@/lib/design-tokens";

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
      <h2 className={typography.sectionHeader}>{title}</h2>
      {viewAllHref && (
        <Link href={viewAllHref} className={`text-[13px] ${typography.link}`}>
          {viewAllLabel}
        </Link>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
