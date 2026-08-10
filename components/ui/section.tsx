import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Section({
  title,
  className,
  children,
  action,
}: {
  title?: string;
  className?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col border border-border bg-surface-2 rounded-sm min-h-0",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="flex-1 min-h-0 p-4">{children}</div>
    </div>
  );
}
