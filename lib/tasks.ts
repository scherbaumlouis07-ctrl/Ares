"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TASKS } from "./constants";
import { taskCompletionPercentage } from "./calculations";
import { todayKey } from "./utils";

export interface TodayTask {
  id: string;
  time: string;
  label: string;
  done: boolean;
}

interface TaskRow {
  id: string;
  title: string;
  scheduled_time: string;
  status: string;
}

const SELECT_COLUMNS = "id, title, scheduled_time, status";

function formatTime(dbTime: string): string {
  return dbTime.slice(0, 5); // "06:00:00" -> "06:00"
}

function toTodayTask(row: TaskRow): TodayTask {
  return { id: row.id, time: formatTime(row.scheduled_time), label: row.title, done: row.status === "done" };
}

async function fetchTasksForDate(date: string): Promise<TaskRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(SELECT_COLUMNS)
    .eq("due_date", date)
    .order("scheduled_time", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Seeds the day's default checklist the first time it's opened on a given
 * date. The unique (user_id, due_date, title) constraint makes this safe to
 * call from multiple tabs at once — upsert with ignoreDuplicates just skips
 * rows that already exist instead of erroring or duplicating.
 */
async function seedTasksForDate(date: string): Promise<TaskRow[]> {
  const supabase = createClient();
  const seedRows = DEFAULT_TASKS.map((task) => ({
    title: task.label,
    scheduled_time: task.time,
    due_date: date,
    status: "todo",
  }));

  const { error } = await supabase
    .from("tasks")
    .upsert(seedRows, { onConflict: "user_id,due_date,title", ignoreDuplicates: true });

  if (error) throw error;

  return fetchTasksForDate(date);
}

export function useTodayTasks() {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const today = todayKey();

  async function load() {
    const existing = await fetchTasksForDate(today);
    const rows = existing.length > 0 ? existing : await seedTasksForDate(today);
    setTasks(rows.map(toTodayTask));
    setHydrated(true);
  }

  useEffect(() => {
    // Fetching can only start after mount, so the resulting setState inside
    // load() is necessarily async and can't be expressed as a lazy useState
    // initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  async function toggle(id: string) {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    const nextDone = !current.done;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t)));

    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({
        status: nextDone ? "done" : "todo",
        completed_at: nextDone ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      console.error("Aufgabe konnte nicht aktualisiert werden:", error);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !nextDone } : t)));
    }
  }

  const progress = taskCompletionPercentage(tasks);

  return { tasks, toggle, progress, hydrated };
}
