"use client";

import { useEffect, useState } from "react";
import { WEEKDAYS_SHORT_DE, HEATMAP_CATEGORIES } from "@/lib/constants";
import { weeklyPerformancePercentage } from "@/lib/calculations";
import { fetchDayCells, dayPercentage, EMPTY_DAY_CELLS, type DayCells } from "@/lib/performance";
import { cn, isoWeekday, todayKey } from "@/lib/utils";

function currentWeekDates(): { key: string; label: string }[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - isoWeekday(now));
  return WEEKDAYS_SHORT_DE.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { key: todayKey(d), label };
  });
}

export function useWeekHeatmap() {
  const [week] = useState(currentWeekDates);
  const [cells, setCells] = useState<Record<string, DayCells>>({});
  const [hydrated, setHydrated] = useState(false);

  async function load() {
    const result = await fetchDayCells(week.map((w) => w.key));
    setCells(result);
    setHydrated(true);
  }

  useEffect(() => {
    // Fetching can only start after mount, so the resulting setState is
    // necessarily async and can't be expressed as a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

  const allFlags = week.flatMap(({ key }) => {
    const c = cells[key] ?? EMPTY_DAY_CELLS;
    return [c.deepWork, c.training, c.sleep];
  });
  const weeklyPercentage = weeklyPerformancePercentage(
    allFlags.map((completed) => ({ completed }))
  );

  const dailyPercentages = week.map(({ key, label }) => ({
    label,
    value: dayPercentage(cells[key] ?? EMPTY_DAY_CELLS),
  }));

  return { week, cells, weeklyPercentage, dailyPercentages, hydrated };
}

const CATEGORY_KEYS: (keyof DayCells)[] = ["deepWork", "training", "sleep"];

export function PerformanceHeatmap({
  week,
  cells,
}: Pick<ReturnType<typeof useWeekHeatmap>, "week" | "cells">) {
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {week.map(({ key, label }) => {
          const dayCells = cells[key] ?? EMPTY_DAY_CELLS;
          return (
            <div key={key} className="flex flex-col gap-1.5 items-center">
              <span className="text-[10px] text-text-muted">{label}</span>
              <div className="flex flex-col gap-1 w-full">
                {CATEGORY_KEYS.map((cat) => (
                  <div
                    key={cat}
                    className={cn(
                      "h-6 w-full border",
                      dayCells[cat] ? "bg-text border-text" : "bg-elevated border-border"
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        {HEATMAP_CATEGORIES.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2",
                i === 0 && "bg-text",
                i === 1 && "bg-text-secondary",
                i === 2 && "bg-text-muted"
              )}
            />
            <span className="text-[10px] text-text-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
