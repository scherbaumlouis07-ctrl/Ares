import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  unit,
  critical,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  critical?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "text-3xl font-semibold tabular-nums leading-none",
          critical ? "text-critical" : "text-text"
        )}
      >
        {value}
        {unit && <span className="text-base font-normal text-text-secondary ml-1">{unit}</span>}
      </span>
    </div>
  );
}
