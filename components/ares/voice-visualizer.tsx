import { cn } from "@/lib/utils";

export type AresState = "idle" | "listening" | "speaking";

const SIZE = 300;
const CENTER = SIZE / 2;
const OUTER_RADIUS = CENTER - 4;
const RING_RADIUS = CENTER - 22;
const INNER_RADIUS = RING_RADIUS - 12;

// Full rotation duration per state — the ring never stops, it only speeds up.
const ROTATION_DURATION: Record<AresState, number> = {
  idle: 24,
  listening: 13,
  speaking: 6,
};

export function VoiceVisualizer({ state }: { state: AresState }) {
  const duration = ROTATION_DURATION[state];

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
      <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill="none" stroke="#242424" strokeWidth={1} opacity={0.5} />

      <g style={{ transformOrigin: `${CENTER}px ${CENTER}px`, animation: `ares-spin ${duration}s linear infinite` }}>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke="#f2f2f2"
          strokeWidth={1.25}
          strokeDasharray="58 34 18 46 30 52 22 40"
          strokeLinecap="round"
          className={cn(
            "transition-opacity duration-500",
            state === "speaking" ? "opacity-90" : state === "listening" ? "opacity-70" : "opacity-45"
          )}
        />
      </g>

      <g
        style={{
          transformOrigin: `${CENTER}px ${CENTER}px`,
          animation: `ares-spin-reverse ${duration * 1.8}s linear infinite`,
        }}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke="#666666"
          strokeWidth={1}
          strokeDasharray="10 60 10 30"
          strokeLinecap="round"
          opacity={0.35}
        />
      </g>
    </svg>
  );
}
