"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { labels } from "@/lib/labels";

interface EmptyStateProps {
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  onRetry?: () => void;
}

export function EmptyState({ message, icon: Icon, action, onRetry }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm py-12 text-center">
      {Icon && (
        <div className="flex justify-center mb-3">
          <Icon className="h-8 w-8 text-gray-300" />
        </div>
      )}
      <p className="text-sm text-gray-400">{message}</p>
      {(action || onRetry) && (
        <div className="mt-4">
          {action ?? (
            <Button type="button" variant="outline" onClick={onRetry}>
              {labels.common.retry}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
