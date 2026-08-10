"use client";

import { createClient } from "@/lib/supabase/client";

export type GoalStatus = "active" | "completed" | "paused" | "archived";
export type Priority = "low" | "normal" | "high" | "critical";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: GoalStatus;
  priority: Priority;
  targetDate: string | null; // YYYY-MM-DD
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category?: string;
  priority?: Priority;
  targetDate?: string;
  progress?: number;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  category?: string;
  status?: GoalStatus;
  priority?: Priority;
  targetDate?: string;
  progress?: number;
}

const SELECT_COLUMNS =
  "id, title, description, category, status, priority, target_date, progress, created_at, updated_at";

interface GoalRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: GoalStatus;
  priority: Priority;
  target_date: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    priority: row.priority,
    targetDate: row.target_date,
    progress: row.progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("goals")
    .insert({
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      priority: input.priority ?? "normal",
      target_date: input.targetDate ?? null,
      progress: input.progress ?? 0,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return toGoal(data);
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.category !== undefined) patch.category = input.category;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.targetDate !== undefined) patch.target_date = input.targetDate;
  if (input.progress !== undefined) patch.progress = input.progress;

  const { data, error } = await supabase
    .from("goals")
    .update(patch)
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return toGoal(data);
}

export async function getGoals(): Promise<Goal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("goals")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toGoal);
}
