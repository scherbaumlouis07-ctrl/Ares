"use client";

import { ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { useTodayTasks } from "@/lib/tasks";

export function DailyTimeline({
  tasks,
  toggle,
}: Pick<ReturnType<typeof useTodayTasks>, "tasks" | "toggle">) {
  return (
    <div className="relative flex flex-col">
      <div className="absolute left-[52px] top-2 bottom-2 w-px bg-border" />
      {tasks.map((task) => (
        <div key={task.id} className="relative flex items-center gap-4 py-3.5">
          <span className="w-[52px] shrink-0 text-xs text-text-muted tabular-nums text-right pr-3 relative z-10 bg-bg">
            {task.time}
          </span>
          <ArrowRight size={14} className="text-border-strong shrink-0" />
          <div
            className={cn(
              "flex-1 flex items-center justify-between px-4 py-2.5 border bg-surface-2 transition-colors duration-150",
              task.done ? "border-border" : "border-border-strong"
            )}
          >
            <span
              className={cn(
                "text-sm",
                task.done ? "text-text-muted line-through" : "text-text"
              )}
            >
              {task.label}
            </span>
            <Checkbox checked={task.done} onChange={() => toggle(task.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}
