"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className = "" }: FilterBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = "検索...",
  className = "",
}: SearchFilterProps) {
  return (
    <div className={`relative flex-1 min-w-[200px] ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder={placeholder}
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  width?: "sm" | "md" | "lg";
  className?: string;
}

const widthClasses = {
  sm: "w-[150px]",
  md: "w-[180px]",
  lg: "w-[200px]",
};

export function SelectFilter({
  label,
  value,
  onChange,
  options,
  id,
  width = "md",
  className = "",
}: SelectFilterProps) {
  const triggerId = id || `filter-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium whitespace-nowrap" htmlFor={triggerId}>
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={triggerId} className={widthClasses[width]}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
