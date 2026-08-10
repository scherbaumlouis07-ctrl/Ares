"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { WEEKDAYS_SHORT_DE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { useWeekTraining } from "@/lib/training";

export function WorkoutPlan({
  days,
  toggle,
}: Pick<ReturnType<typeof useWeekTraining>, "days" | "toggle">) {
  return (
    <div className="flex flex-col gap-2.5">
      {days.map((day, i) => (
        <div key={day.dateKey} className="flex items-center gap-3">
          <span className="text-xs text-text-muted w-8 shrink-0">{WEEKDAYS_SHORT_DE[i]}</span>
          <span
            className={cn(
              "text-sm flex-1 truncate",
              day.kind === "rest" ? "text-text-muted" : "text-text"
            )}
          >
            {day.label}
          </span>
          {day.kind !== "rest" && (
            <Checkbox checked={day.completed} onChange={() => toggle(day.dateKey)} />
          )}
        </div>
      ))}
    </div>
  );
}
