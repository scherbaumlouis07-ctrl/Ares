-- Stores investment opportunities Ares discovers through its own research
-- (stocks, industries, technologies, commodities, macro trends). Deliberately
-- small and append-light — the anti-spam discipline (only a few genuinely
-- new ideas, not dozens a day) is enforced in application code, this table
-- just needs a unique-ish guard against literal duplicate titles.
--
-- Run once in Supabase Dashboard → SQL Editor → Run. Idempotent.

create table if not exists public.investment_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('stock', 'industry', 'technology', 'commodity', 'macro')),
  ticker text,
  thesis text not null,
  status text not null default 'active' check (status in ('active', 'archived', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title)
);

create index if not exists investment_opportunities_user_created_idx
  on public.investment_opportunities (user_id, created_at desc);

alter table public.investment_opportunities enable row level security;

drop policy if exists "Owner full access" on public.investment_opportunities;
create policy "Owner full access" on public.investment_opportunities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.investment_opportunities;
create trigger set_updated_at before update on public.investment_opportunities
  for each row execute function public.set_updated_at();
