"use client";

import { createClient } from "@/lib/supabase/client";

export type ProjectStatus = "active" | "completed" | "paused" | "archived";

export interface Project {
  id: string;
  goalId: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  goalId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  goalId?: string | null;
}

const SELECT_COLUMNS = "id, goal_id, name, description, status, created_at, updated_at";

interface ProjectRow {
  id: string;
  goal_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    goalId: row.goal_id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      description: input.description ?? null,
      goal_id: input.goalId ?? null,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return toProject(data);
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.goalId !== undefined) patch.goal_id = input.goalId;

  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return toProject(data);
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toProject);
}
