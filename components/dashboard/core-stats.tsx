"use client";

import { ProgressBar } from "@/components/ui/progress-bar";
import { useCoreStats } from "@/lib/core-stats";

export function CoreStats() {
  const { stats } = useCoreStats();

  return (
    <div className="flex flex-col gap-4 justify-center h-full">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">{stat.label}</span>
            <span className="tabular-nums text-text">{stat.value}%</span>
          </div>
          <ProgressBar value={stat.value} />
        </div>
      ))}
    </div>
  );
}
