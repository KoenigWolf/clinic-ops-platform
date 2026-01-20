"use client";

import { componentStyles } from "@/lib/design-tokens";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({ message, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className={componentStyles.emptyState.container}>
      {Icon && (
        <div className="flex justify-center mb-3">
          <Icon className="h-8 w-8 text-gray-300" />
        </div>
      )}
      <p className={componentStyles.emptyState.text}>{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
