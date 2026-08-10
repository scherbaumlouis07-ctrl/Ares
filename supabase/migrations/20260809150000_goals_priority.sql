-- Adds a priority field to goals, matching the same scale already used on
-- tasks (low/normal/high/critical). Needed for goals like:
--   Title: "10.000 € Monatsumsatz", Deadline: 2027-12-31, Priority: High
--
-- Run once in Supabase Dashboard → SQL Editor → Run. Idempotent.

alter table public.goals
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical'));
