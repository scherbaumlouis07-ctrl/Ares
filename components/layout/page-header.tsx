"use client";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const dateLabel = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <div
      className={cn(
        "flex items-center justify-between px-8 py-5 border-b border-border shrink-0",
        className
      )}
    >
      <h1 className="text-lg font-semibold tracking-tight text-text">{title}</h1>
      <span className="text-xs text-text-muted capitalize">{dateLabel}</span>
    </div>
  );
}
