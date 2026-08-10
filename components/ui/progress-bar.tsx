import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  critical,
}: {
  value: number;
  className?: string;
  critical?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full bg-elevated overflow-hidden", className)}>
      <div
        className={cn(
          "h-full transition-all duration-500 ease-out",
          critical ? "bg-critical" : "bg-text"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
