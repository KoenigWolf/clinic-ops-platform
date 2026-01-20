"use client";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-10 h-10",
};

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initial = name.charAt(0);

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-50 flex items-center justify-center ${className}`}>
      <span className="text-sm font-medium text-gray-600">{initial}</span>
    </div>
  );
}
