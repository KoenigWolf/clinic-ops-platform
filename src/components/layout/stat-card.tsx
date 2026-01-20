"use client";

import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  href?: string;
}

export function StatCard({ label, value, href }: StatCardProps) {
  const content = (
    <>
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold tracking-tight mt-1">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="bg-white rounded-xl shadow-sm hover:shadow transition-shadow p-3 sm:p-5">
        {content}
      </Link>
    );
  }

  return <div className="bg-white rounded-xl shadow-sm p-3 sm:p-5">{content}</div>;
}

interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 md:grid-cols-4",
  }[columns];

  return <div className={`grid ${colsClass} gap-3 sm:gap-4 mb-4`}>{children}</div>;
}
