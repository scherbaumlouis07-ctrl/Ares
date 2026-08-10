"use client";

import { DailyTimeline } from "@/components/tasks/daily-timeline";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useTodayTasks } from "@/lib/tasks";

export default function TodayPage() {
  const { tasks, toggle, progress } = useTodayTasks();

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6">
          <h1 className="text-sm font-medium text-text-secondary mb-5">
            Ihre heutigen Aufgaben, Sir:
          </h1>
          <DailyTimeline tasks={tasks} toggle={toggle} />
        </div>

        <div className="w-[340px] shrink-0 border-l border-border flex flex-col items-center justify-center gap-6 px-8">
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Today&apos;s Progress
          </span>
          <span className="text-6xl font-semibold tabular-nums text-text">{progress}%</span>
          <ProgressBar value={progress} className="w-full" />
        </div>
      </div>
    </div>
  );
}
