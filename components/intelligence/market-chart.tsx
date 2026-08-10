import { PriceLineChart } from "@/components/charts/price-line-chart";
import type { PricePoint } from "@/lib/mock-data";

export function MarketChart({
  label,
  data,
  valuePrefix = "$",
}: {
  label: string;
  data: PricePoint[];
  valuePrefix?: string;
}) {
  const latest = data[data.length - 1]?.value ?? 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between shrink-0 mb-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-text">
          {valuePrefix}
          {latest.toLocaleString()}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <PriceLineChart data={data} valuePrefix={valuePrefix} />
      </div>
    </div>
  );
}
