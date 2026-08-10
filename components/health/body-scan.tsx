"use client";

import { MUSCLE_GROUPS_BY_KIND, type TrainingKind } from "@/lib/constants";
import { normalizeRegions, type MuscleRegion } from "./muscle-highlight";

const REGION_FILL_IDLE = "#1c1c1c";
const REGION_STROKE_IDLE = "#2c2c2c";
const REGION_ACTIVE = "#e5484d";

function Region({
  id,
  active,
  d,
}: {
  id: MuscleRegion;
  active: Set<MuscleRegion>;
  d: string;
}) {
  const isActive = active.has(id);
  return (
    <path
      d={d}
      fill={isActive ? REGION_ACTIVE : REGION_FILL_IDLE}
      fillOpacity={isActive ? 0.55 : 1}
      stroke={isActive ? REGION_ACTIVE : REGION_STROKE_IDLE}
      strokeWidth={1}
      className="transition-all duration-500 ease-out"
    />
  );
}

export function BodyScan({
  kind,
  bodyFat,
  weightKg,
}: {
  kind: TrainingKind;
  bodyFat: number;
  weightKg: number;
}) {
  const active = normalizeRegions(MUSCLE_GROUPS_BY_KIND[kind]);

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <svg width="220" height="440" viewBox="0 0 220 440" className="overflow-visible">
        <defs>
          <pattern id="scanGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0 L0 0 0 10" fill="none" stroke="#ffffff08" strokeWidth={1} />
          </pattern>
        </defs>

        {/* outline silhouette */}
        <path
          d="M110 20
             c14 0 24 12 24 26 c0 10 -5 17 -10 21
             c16 6 26 20 28 38 l6 46
             c2 10 -2 18 -10 20 l-10 3 4 60 8 90
             c1 9 -6 15 -14 15 h-8 l-4 -70 -4 70 h-8
             c-8 0 -15 -6 -14 -15 l8 -90 4 -60 -10 -3
             c-8 -2 -12 -10 -10 -20 l6 -46
             c2 -18 12 -32 28 -38
             c-5 -4 -10 -11 -10 -21 c0 -14 10 -26 24 -26 Z"
          fill="url(#scanGrid)"
          stroke="#2c2c2c"
          strokeWidth={1.25}
        />

        {/* shoulders */}
        <Region id="shoulders" active={active} d="M64 78 c-14 2 -24 10 -28 22 l10 6 c4 -10 10 -18 20 -22 Z M156 78 c14 2 24 10 28 22 l-10 6 c-4 -10 -10 -18 -20 -22 Z" />

        {/* chest */}
        <Region id="chest" active={active} d="M84 92 c8 6 18 9 26 9 c8 0 18 -3 26 -9 l4 22 c-10 8 -20 12 -30 12 c-10 0 -20 -4 -30 -12 Z" />

        {/* back (abstract side strips) */}
        <Region id="back" active={active} d="M70 96 l-6 34 8 2 6 -34 Z M150 96 l6 34 -8 2 -6 -34 Z" />

        {/* biceps */}
        <Region id="biceps" active={active} d="M50 108 c-6 4 -10 12 -10 22 l4 22 12 -2 -2 -24 c0 -8 2 -14 6 -18 Z M170 108 c6 4 10 12 10 22 l-4 22 -12 -2 2 -24 c0 -8 -2 -14 -6 -18 Z" />

        {/* forearms */}
        <Region id="forearms" active={active} d="M44 152 l4 34 12 -1 -3 -33 Z M176 152 l-4 34 -12 -1 3 -33 Z" />

        {/* glutes */}
        <Region id="glutes" active={active} d="M92 232 l-4 20 h44 l-4 -20 Z" />

        {/* quads */}
        <Region id="quads" active={active} d="M92 254 l-6 56 18 2 4 -58 Z M128 254 l6 56 -18 2 -4 -58 Z" />

        {/* hamstrings (abstract rear strips) */}
        <Region id="hamstrings" active={active} d="M86 260 l-3 46 6 1 3 -47 Z M134 260 l3 46 -6 1 -3 -47 Z" />

        {/* calves */}
        <Region id="calves" active={active} d="M90 322 l-3 42 16 2 1 -44 Z M130 322 l3 42 -16 2 -1 -44 Z" />
      </svg>

      {/* metric callouts */}
      <div className="absolute right-2 top-[28%] flex items-center gap-2">
        <div className="w-10 h-px bg-border-strong" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">Body Fat</span>
          <span className="text-lg font-semibold tabular-nums text-text">{bodyFat.toFixed(1)}%</span>
        </div>
      </div>
      <div className="absolute right-2 top-[52%] flex items-center gap-2">
        <div className="w-10 h-px bg-border-strong" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">Weight</span>
          <span className="text-lg font-semibold tabular-nums text-text">
            {weightKg.toFixed(1)} <span className="text-xs font-normal text-text-secondary">KG</span>
          </span>
        </div>
      </div>
    </div>
  );
}
