"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WHOOP_MOCK } from "@/lib/whoop-mock";
import { percentage } from "@/lib/calculations";

export interface CoreStat {
  label: string;
  value: number;
}

function last7DaysRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return { start: toKey(start), end: toKey(end) };
}

/**
 * Core Stats are weekly figures:
 * - Disziplin: % of tasks due in the last 7 days that were marked done.
 * - Energy: average WHOOP Recovery over the last 7 days. Until WHOOP is
 *   actually connected there's only a single mock Recovery number (no daily
 *   history), so this treats every day as having had that same value —
 *   once real per-day Recovery data exists, this becomes a true average
 *   without any change to the formula itself.
 */
export function useCoreStats() {
  const [disziplin, setDisziplin] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  async function load() {
    const { start, end } = last7DaysRange();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("status")
      .gte("due_date", start)
      .lte("due_date", end);

    if (!error && data) {
      const done = data.filter((task) => task.status === "done").length;
      setDisziplin(percentage(done, data.length));
    }
    setHydrated(true);
  }

  useEffect(() => {
    // Fetching can only start after mount, so the resulting setState is
    // necessarily async and can't be expressed as a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const stats: CoreStat[] = [
    { label: "Disziplin", value: disziplin },
    { label: "Energy", value: WHOOP_MOCK.recovery },
  ];

  return { stats, hydrated };
}
