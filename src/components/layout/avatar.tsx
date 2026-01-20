"use client";

import { componentStyles } from "@/lib/design-tokens";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initial = name.charAt(0);
  const sizeClass = componentStyles.avatar[size];

  return (
    <div className={`${sizeClass} ${className}`}>
      <span className={componentStyles.avatar.text}>{initial}</span>
    </div>
  );
}
