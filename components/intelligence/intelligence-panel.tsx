"use client";

import { useState } from "react";
import { Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IntelligenceEntry {
  title: string;
  body: string;
  /** Overrides the default "{heading} · Mock" tag, e.g. with a real date once the entry isn't mocked. */
  tag?: string;
}

/**
 * UI placeholder for Ares reading a report aloud. No TTS backend yet —
 * clicking just toggles a visual "reading" state to demonstrate the
 * interaction that a later phase will wire to real audio + follow-up Q&A.
 */
export function IntelligencePanel({
  heading,
  entries,
  readAloudLabel,
}: {
  heading: string;
  entries: IntelligenceEntry[];
  readAloudLabel: string;
}) {
  const [reading, setReading] = useState(false);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {entries.map((entry, i) => (
          <div key={i} className="flex flex-col gap-1.5 pb-4 border-b border-border last:border-b-0">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              {entry.tag ?? `${heading} · Mock`}
            </span>
            <span className="text-sm font-medium text-text">{entry.title}</span>
            <p className="text-xs leading-relaxed text-text-secondary">{entry.body}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => setReading((v) => !v)}
        className={cn(
          "flex items-center justify-center gap-2 border py-2.5 text-xs font-medium uppercase tracking-wider transition-colors shrink-0",
          reading
            ? "border-critical/50 text-critical"
            : "border-border-strong text-text hover:border-text-secondary"
        )}
      >
        {reading ? <Square size={13} /> : <Volume2 size={13} />}
        {reading ? "Stop" : readAloudLabel}
      </button>
    </div>
  );
}
