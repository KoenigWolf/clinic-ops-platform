"use client";

import Link from "next/link";
import { typography, componentStyles } from "@/lib/design-tokens";

interface StatCardProps {
  label: string;
  value: string | number;
  href?: string;
}

export function StatCard({ label, value, href }: StatCardProps) {
  const content = (
    <>
      <p className={typography.label}>{label}</p>
      <p className={`${typography.statValue} mt-1`}>{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${componentStyles.card.interactive} p-5`}>
        {content}
      </Link>
    );
  }

  return <div className={`${componentStyles.card.base} p-5`}>{content}</div>;
}

interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[columns];

  return <div className={`grid ${colsClass} gap-4 mb-8`}>{children}</div>;
}
