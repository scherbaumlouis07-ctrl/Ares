import { cn } from "@/lib/utils";

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: "neutral" | "critical" | "active";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider px-2 py-1 border",
        tone === "critical" && "border-critical/40 text-critical",
        tone === "active" && "border-border-strong text-text",
        tone === "neutral" && "border-border text-text-muted",
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "critical" && "bg-critical",
          tone === "active" && "bg-text",
          tone === "neutral" && "bg-text-muted"
        )}
      />
      {label}
    </span>
  );
}
