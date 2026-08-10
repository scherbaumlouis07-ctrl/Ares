"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WHOOP_MOCK, SLEEP_HEATMAP_THRESHOLD } from "@/lib/whoop-mock";
import { MONTHS_SHORT_DE } from "@/lib/constants";
import { todayKey } from "@/lib/utils";

export interface DayCells {
  deepWork: boolean;
  training: boolean;
  sleep: boolean;
}

export const EMPTY_DAY_CELLS: DayCells = { deepWork: false, training: false, sleep: false };

const SLEEP_MET = WHOOP_MOCK.sleep >= SLEEP_HEATMAP_THRESHOLD;

export function dayPercentage(cells: DayCells): number {
  const done = [cells.deepWork, cells.training, cells.sleep].filter(Boolean).length;
  return Math.round((done / 3) * 100);
}

/**
 * Deep Work: erfüllt, wenn an dem Tag alle Heutigen Aufgaben abgehakt sind.
 * Training: erfüllt, wenn der Training-Task an dem Tag abgehakt ist.
 * Sleep: nur für heute anhand des aktuellen WHOOP-Mock-Werts ausgewertet.
 *
 * Shared by the weekly heatmap and the monthly/yearly aggregates below, so
 * day/week/month/year performance are all derived from the exact same
 * underlying real data instead of separately mocked series.
 */
export async function fetchDayCells(dateKeys: string[]): Promise<Record<string, DayCells>> {
  if (dateKeys.length === 0) return {};

  const supabase = createClient();
  const today = todayKey();

  const result: Record<string, DayCells> = {};
  dateKeys.forEach((key) => {
    result[key] = { deepWork: false, training: false, sleep: key === today && SLEEP_MET };
  });

  const { data, error } = await supabase
    .from("tasks")
    .select("title, status, due_date")
    .in("due_date", dateKeys);

  if (!error && data) {
    const byDate = new Map<string, { title: string; status: string }[]>();
    data.forEach((row) => {
      const list = byDate.get(row.due_date) ?? [];
      list.push({ title: row.title, status: row.status });
      byDate.set(row.due_date, list);
    });

    byDate.forEach((rows, date) => {
      const cell = result[date];
      if (!cell) return;
      cell.deepWork = rows.length > 0 && rows.every((r) => r.status === "done");
      cell.training = rows.some((r) => r.title === "Training" && r.status === "done");
    });
  }

  return result;
}

export interface MonthPoint {
  label: string;
  value: number;
}

function datesFromYearStartToToday(): string[] {
  const now = new Date();
  const cursor = new Date(now.getFullYear(), 0, 1);
  const keys: string[] = [];
  while (cursor <= now) {
    keys.push(todayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

/**
 * One data point per month of the current year — each is the average daily
 * performance (Deep Work / Training / Sleep) over the elapsed days of that
 * month. Months with no elapsed days yet, or no real activity recorded,
 * show 0 — there's nothing to average, not a placeholder.
 */
export function useMonthlyPerformance() {
  const [months, setMonths] = useState<MonthPoint[]>(
    MONTHS_SHORT_DE.map((label) => ({ label, value: 0 }))
  );
  const [hydrated, setHydrated] = useState(false);

  async function load() {
    const keys = datesFromYearStartToToday();
    const cells = await fetchDayCells(keys);

    const sums = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }));
    keys.forEach((key) => {
      const monthIndex = Number(key.slice(5, 7)) - 1;
      sums[monthIndex].sum += dayPercentage(cells[key] ?? EMPTY_DAY_CELLS);
      sums[monthIndex].count += 1;
    });

    setMonths(
      MONTHS_SHORT_DE.map((label, i) => ({
        label,
        value: sums[i].count > 0 ? Math.round(sums[i].sum / sums[i].count) : 0,
      }))
    );
    setHydrated(true);
  }

  useEffect(() => {
    // Fetching can only start after mount, so the resulting setState is
    // necessarily async and can't be expressed as a lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return { months, hydrated };
}
