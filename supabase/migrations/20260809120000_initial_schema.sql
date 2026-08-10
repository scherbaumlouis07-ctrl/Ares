-- ARES OS — initial schema
-- Run once in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE).

-- ---------------------------------------------------------------------------
-- Shared helper: keeps `updated_at` current on every UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- memories — persistent facts Ares remembers about the user across sessions.
-- ---------------------------------------------------------------------------
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('user', 'feedback', 'project', 'reference')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_user_type_idx on public.memories (user_id, type);

drop trigger if exists set_updated_at on public.memories;
create trigger set_updated_at before update on public.memories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- goals — long-horizon targets (health, business, personal, ...).
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'archived')),
  target_date date,
  progress smallint not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_status_idx on public.goals (user_id, status);

drop trigger if exists set_updated_at on public.goals;
create trigger set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- projects — concrete initiatives, optionally tied to a goal.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_status_idx on public.projects (user_id, status);
create index if not exists projects_goal_idx on public.projects (goal_id);

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tasks — actionable items, optionally scoped to a project and/or a day.
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  due_date date,
  scheduled_time time,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_status_idx on public.tasks (user_id, status);
create index if not exists tasks_project_idx on public.tasks (project_id);
create index if not exists tasks_due_date_idx on public.tasks (due_date);

drop trigger if exists set_updated_at on public.tasks;
create trigger set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- daily_logs — generic date-keyed daily tracking (heatmap cells, outreach
-- counts, training completion, ...). One row per (user, date, category).
-- ---------------------------------------------------------------------------
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  log_date date not null,
  category text not null,
  value jsonb not null default 'true'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date, category)
);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date);

drop trigger if exists set_updated_at on public.daily_logs;
create trigger set_updated_at before update on public.daily_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- metrics — numeric time series (WHOOP scores, weight, body fat, discipline
-- percentages, ...). Append-only.
-- ---------------------------------------------------------------------------
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  metric_key text not null,
  value numeric not null,
  metadata jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists metrics_user_key_time_idx on public.metrics (user_id, metric_key, recorded_at desc);

-- ---------------------------------------------------------------------------
-- conversations — Ares chat/voice message log. One row per message; rows
-- sharing a conversation_id belong to the same session. Append-only.
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  conversation_id uuid not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_conv_idx on public.conversations (user_id, conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- decisions — logged decisions with context/rationale, optionally tied to a
-- project.
-- ---------------------------------------------------------------------------
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  context text,
  decision text not null,
  rationale text,
  status text not null default 'active' check (status in ('active', 'revisited', 'reversed')),
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists decisions_user_decided_idx on public.decisions (user_id, decided_at desc);
create index if not exists decisions_project_idx on public.decisions (project_id);

drop trigger if exists set_updated_at on public.decisions;
create trigger set_updated_at before update on public.decisions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- journal_entries — free-form journal, mirrors the current localStorage
-- shape (content + timestamp). Append-only; six-month retention is enforced
-- client-side today and can move to a scheduled job later.
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — every table is locked to its owning user. No auth
-- flow exists in the app yet, so with only the anon key these tables are
-- inaccessible to anyone (deny-by-default via RLS), which is the correct
-- state until Supabase Auth is wired up in a later phase.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'memories', 'goals', 'projects', 'tasks', 'daily_logs',
      'metrics', 'conversations', 'decisions', 'journal_entries'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'drop policy if exists "Owner full access" on public.%I', t
    );
    execute format(
      'create policy "Owner full access" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;
