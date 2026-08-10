"use client";

import { Minus, Plus } from "lucide-react";
import { useOutreachTracker } from "@/lib/outreach";
import { OUTREACH_CHANNELS } from "@/lib/constants";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

export function OutreachTracker() {
  const { counts, adjust } = useOutreachTracker();

  return (
    <div className="flex flex-col gap-5">
      {OUTREACH_CHANNELS.map((channel) => {
        const count = counts[channel.key] ?? 0;
        return (
          <div key={channel.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">{channel.label}</span>
              <span className="text-xs tabular-nums text-text-secondary">
                {count} / {channel.target}
              </span>
            </div>
            <ProgressBar value={(count / channel.target) * 100} />
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={() => adjust(channel.key, -1, channel.target)}
                className="flex items-center justify-center size-6 border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => adjust(channel.key, 1, channel.target)}
                className={cn(
                  "flex items-center justify-center size-6 border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors",
                  count >= channel.target && "opacity-40 pointer-events-none"
                )}
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
