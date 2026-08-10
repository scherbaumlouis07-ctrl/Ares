"use client";

import { Section } from "@/components/ui/section";
import { TaskListCompact } from "@/components/tasks/task-list-compact";
import { WhoopCoreScores, WhoopAge } from "@/components/dashboard/whoop-overview";
import { CoreStats } from "@/components/dashboard/core-stats";
import { PerformanceHeatmap, useWeekHeatmap } from "@/components/dashboard/performance-heatmap";
import { PercentageLineChart } from "@/components/charts/percentage-line-chart";
import { useMonthlyPerformance } from "@/lib/performance";

export default function DashboardPage() {
  const { week, cells, weeklyPercentage, dailyPercentages } = useWeekHeatmap();
  const { months } = useMonthlyPerformance();

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="grid grid-cols-12 gap-4 flex-[1.1] min-h-0">
        <Section title="Heutige Aufgaben" className="col-span-3">
          <TaskListCompact />
        </Section>
        <Section title="WHOOP Core Scores" className="col-span-6">
          <WhoopCoreScores />
        </Section>
        <Section title="WHOOP Age" className="col-span-3">
          <WhoopAge />
        </Section>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-[1.4] min-h-0">
        <Section title="Core Stats" className="col-span-3">
          <CoreStats />
        </Section>
        <Section title="Performance Heatmap" className="col-span-6">
          <PerformanceHeatmap week={week} cells={cells} />
        </Section>
        <Section title="Weekly Performance" className="col-span-3">
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <span className="text-5xl font-semibold tabular-nums text-text">
              {weeklyPercentage}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              diese Woche
            </span>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-[1.3] min-h-0">
        <Section title="Weekly Performance Days">
          <PercentageLineChart data={dailyPercentages} />
        </Section>
        <Section title="Monthly Performance">
          <PercentageLineChart data={months} />
        </Section>
      </div>
    </div>
  );
}
