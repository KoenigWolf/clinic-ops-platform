"use client";

import { typography } from "@/lib/design-tokens";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className={typography.pageTitle}>{title}</h1>
        {description && (
          <p className={`${typography.body} mt-1`}>{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 sm:gap-3">{actions}</div>}
    </div>
  );
}
