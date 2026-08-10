import { MetricCard } from "@/components/ui/metric-card";
import { WHOOP_MOCK } from "@/lib/whoop-mock";

const CORE_SCORES = [
  { label: "Sleep", value: WHOOP_MOCK.sleep, unit: "%" },
  { label: "Recovery", value: WHOOP_MOCK.recovery, unit: "%" },
  { label: "Strain", value: WHOOP_MOCK.strain, unit: "" },
];

export function WhoopCoreScores() {
  return (
    <div className="grid grid-cols-3 gap-4 h-full items-center">
      {CORE_SCORES.map((score) => (
        <MetricCard key={score.label} label={score.label} value={score.value} unit={score.unit} />
      ))}
    </div>
  );
}

export function WhoopAge() {
  return (
    <div className="flex flex-col gap-4 h-full justify-center">
      <MetricCard label="WHOOP Age" value={18.4} />
      <MetricCard label="Pace of Aging" value="0.8x" />
    </div>
  );
}
