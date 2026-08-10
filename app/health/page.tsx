"use client";

import { Section } from "@/components/ui/section";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkoutPlan } from "@/components/health/workout-plan";
import { BodyScan } from "@/components/health/body-scan";
import { PercentageLineChart } from "@/components/charts/percentage-line-chart";
import { useWeekTraining } from "@/lib/training";
import { trainingDisciplineYearlyMock } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function HealthPage() {
  const { days, toggle, disciplinePercentage, dailyPercentages, todayEntry } = useWeekTraining();
  const yearly = trainingDisciplineYearlyMock();

  return (
    <div className="h-full flex p-4 gap-4">
      <div className="w-1/3 flex flex-col gap-4 min-h-0">
        <Section title="Trainingsplan" className="flex-[1.1]">
          <WorkoutPlan days={days} toggle={toggle} />
        </Section>
        <Section title="Trainingsdisziplin — Weekly" className="flex-1">
          <div className="flex flex-col h-full gap-2">
            <span className="text-2xl font-semibold tabular-nums text-text">
              {disciplinePercentage}%
            </span>
            <div className="flex-1 min-h-0">
              <PercentageLineChart data={dailyPercentages} />
            </div>
          </div>
        </Section>
        <Section title="Trainingsdisziplin — Yearly" className="flex-1">
          <PercentageLineChart data={yearly} />
        </Section>
      </div>

      <div className="w-2/3 flex flex-col gap-4 min-h-0">
        <Section className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-text-secondary">Heutiges Training:</span>
              <span
                className={cn(
                  "text-base font-medium",
                  todayEntry.kind === "rest" ? "text-text-muted" : "text-text"
                )}
              >
                {todayEntry.label}
              </span>
            </div>
            {todayEntry.kind !== "rest" && (
              <Checkbox checked={todayEntry.completed} onChange={() => toggle(todayEntry.dateKey)} />
            )}
          </div>
        </Section>
        <Section title="Body Scan" className="flex-1 min-h-0">
          <BodyScan kind={todayEntry.kind} bodyFat={11.4} weightKg={74.0} />
        </Section>
      </div>
    </div>
  );
}
