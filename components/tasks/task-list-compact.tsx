"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTodayTasks } from "@/lib/tasks";
import { cn } from "@/lib/utils";

export function TaskListCompact() {
  const { tasks, toggle } = useTodayTasks();

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-3">
          <Checkbox checked={task.done} onChange={() => toggle(task.id)} />
          <span className="text-xs text-text-muted tabular-nums w-10 shrink-0">{task.time}</span>
          <span
            className={cn(
              "text-sm truncate",
              task.done ? "text-text-muted line-through" : "text-text"
            )}
          >
            {task.label}
          </span>
        </div>
      ))}
    </div>
  );
}
