"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OUTREACH_CHANNELS } from "@/lib/constants";
import { todayKey } from "@/lib/utils";

type Counts = Record<string, number>;

function categoryFor(channelKey: string): string {
  return `outreach_${channelKey}`;
}

/**
 * Outreach counts live in the generic `daily_logs` table (one row per
 * user/date/category), so every past day's counts stay on record — nothing
 * gets overwritten across days, only today's row is upserted as counts
 * change. This is what lets a later feature compute historical consistency
 * (e.g. "Cold-Email-Konstanz diesen Monat: 87%") straight from the data.
 */
export function useOutreachTracker() {
  const [counts, setCounts] = useState<Counts>({});
  const [hydrated, setHydrated] = useState(false);
  const today = todayKey();

  async function load() {
    const supabase = createClient();
    const categories = OUTREACH_CHANNELS.map((c) => categoryFor(c.key));
    const { data, error } = await supabase
      .from("daily_logs")
      .select("category, value")
      .eq("log_date", today)
      .in("category", categories);

    const loaded: Counts = {};
    if (!error && data) {
      data.forEach((row) => {
        const channel = OUTREACH_CHANNELS.find((c) => categoryFor(c.key) === row.category);
        if (channel) loaded[channel.key] = Number(row.value) || 0;
      });
    }
    setCounts(loaded);
    setHydrated(true);
  }

  useEffect(() => {
    // Fetching can only start after mount, so the resulting setState is
    // necessarily async and can't be expressed as a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  async function adjust(channelKey: string, delta: number, target: number) {
    const current = counts[channelKey] ?? 0;
    const next = Math.max(0, Math.min(target, current + delta));

    setCounts((prev) => ({ ...prev, [channelKey]: next }));

    const supabase = createClient();
    const { error } = await supabase
      .from("daily_logs")
      .upsert(
        { log_date: today, category: categoryFor(channelKey), value: next },
        { onConflict: "user_id,log_date,category" }
      );

    if (error) {
      console.error("Outreach-Zähler konnte nicht gespeichert werden:", error);
      setCounts((prev) => ({ ...prev, [channelKey]: current }));
    }
  }

  return { counts, adjust, hydrated };
}
