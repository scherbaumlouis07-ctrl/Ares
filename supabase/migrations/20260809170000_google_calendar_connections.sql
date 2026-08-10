-- Stores the Google OAuth tokens needed to read (and later write) the
-- user's Google Calendar on their behalf. One connection per user.
--
-- Run once in Supabase Dashboard → SQL Editor → Run. Idempotent.

create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  scope text not null,
  token_type text not null default 'Bearer',
  expiry_date bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.google_calendar_connections enable row level security;

drop policy if exists "Owner full access" on public.google_calendar_connections;
create policy "Owner full access" on public.google_calendar_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.google_calendar_connections;
create trigger set_updated_at before update on public.google_calendar_connections
  for each row execute function public.set_updated_at();
