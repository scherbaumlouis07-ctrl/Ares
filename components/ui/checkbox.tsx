"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onChange,
  disabled,
  className,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "flex items-center justify-center size-4 shrink-0 border transition-colors duration-150",
        checked
          ? "bg-text border-text"
          : "bg-transparent border-border-strong hover:border-text-secondary",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {checked && <Check size={11} strokeWidth={3} className="text-bg" />}
    </button>
  );
}
