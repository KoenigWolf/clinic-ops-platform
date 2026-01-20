"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({ message, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm py-12 text-center">
      {Icon && (
        <div className="flex justify-center mb-3">
          <Icon className="h-8 w-8 text-gray-300" />
        </div>
      )}
      <p className="text-sm text-gray-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
