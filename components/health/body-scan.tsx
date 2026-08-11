"use client";

import Script from "next/script";
import { MUSCLE_GROUPS_BY_KIND, type TrainingKind } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MUSCLE_LABELS_DE: Record<string, string> = {
  shoulders: "Schultern",
  chest: "Brust",
  back: "Rücken",
  lats: "Rücken",
  biceps: "Bizeps",
  triceps: "Trizeps",
  forearms: "Unterarme",
  quads: "Beine",
  hamstrings: "Beine",
  glutes: "Beine",
  calves: "Beine",
};

function activeMuscleLabels(kind: TrainingKind): string[] {
  const labels = MUSCLE_GROUPS_BY_KIND[kind].map((g) => MUSCLE_LABELS_DE[g] ?? g);
  return Array.from(new Set(labels));
}

// Fixed (not random) so server/client render identically — a handful of
// scan particles rising off the disc and fading out, staggered so they
// never all fire at once.
const SCAN_PARTICLES = [
  { left: "10%", delay: "0s", duration: "3.2s" },
  { left: "22%", delay: "1.4s", duration: "3.8s" },
  { left: "34%", delay: "0.6s", duration: "3.4s" },
  { left: "46%", delay: "2.1s", duration: "3s" },
  { left: "58%", delay: "0.3s", duration: "3.6s" },
  { left: "68%", delay: "1.8s", duration: "3.3s" },
  { left: "78%", delay: "0.9s", duration: "3.9s" },
  { left: "88%", delay: "2.5s", duration: "3.1s" },
  { left: "50%", delay: "1.1s", duration: "3.5s" },
  { left: "40%", delay: "2.8s", duration: "3.7s" },
];

export function BodyScan({
  kind,
  bodyFat,
  weightKg,
}: {
  kind: TrainingKind;
  bodyFat: number;
  weightKg: number;
}) {
  const active = kind !== "rest";
  const labels = activeMuscleLabels(kind);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Script type="module" src="https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js" strategy="afterInteractive" />

      {active && (
        <div className="absolute left-1/2 top-3 -translate-x-1/2 flex flex-wrap justify-center gap-1.5 z-10">
          {labels.map((label) => (
            <span
              key={label}
              className="text-[10px] uppercase tracking-wider text-critical border border-critical-dim px-1.5 py-0.5"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Stationary technical platform — glows/pulses, never rotates. Sits
          under the model's own vertical center so the feet land mid-disc. */}
      <div className="absolute left-1/2 top-[80%] -translate-x-1/2 w-[62%] aspect-[5/1] z-0">
        <div className="absolute inset-0 rounded-[50%] border border-border-strong/70" />
        <div
          className={cn(
            "absolute inset-[10%] rounded-[50%] border-2",
            active ? "border-critical" : "border-text-secondary/70"
          )}
          style={{ animation: "disc-glow-pulse 2.4s ease-in-out infinite" }}
        />
        <div
          className={cn("absolute inset-[24%] rounded-[50%] blur-[3px]", active ? "bg-critical/50" : "bg-text/25")}
          style={{ animation: "disc-glow-pulse 2.4s ease-in-out infinite reverse" }}
        />

        {/* Scan particles — drift up off the disc and fade out, looping. */}
        {SCAN_PARTICLES.map((p, i) => (
          <div
            key={i}
            className={cn(
              "absolute bottom-1/2 h-3 w-[2px] rounded-full blur-[0.5px]",
              active ? "bg-critical" : "bg-text-secondary"
            )}
            style={{
              left: p.left,
              animation: `particle-rise ${p.duration} ease-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <model-viewer
        src="/health/body.glb"
        alt="3D-Körpermodell"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="16deg"
        disable-zoom
        disable-pan
        shadow-intensity="0"
        exposure="1.1"
        loading="eager"
        reveal="auto"
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[88%] z-10",
          active && "animate-[body-rim-glow_2.2s_ease-in-out_infinite]"
        )}
        style={{ mixBlendMode: "screen", background: "transparent" }}
      />

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
