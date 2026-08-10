-- Adds explicit Datum/Uhrzeit columns to journal_entries, alongside the
-- existing content ("Text") and created_at columns.
--
-- These are plain columns with defaults (not GENERATED, which Postgres
-- forbids for timezone-aware expressions since they're not immutable).
-- Because both defaults and created_at's default all call now() within the
-- same INSERT statement/transaction, Postgres evaluates now() once per
-- transaction — so entry_date, entry_time, and created_at always describe
-- the exact same instant, just in different shapes.
--
-- Run once in Supabase Dashboard → SQL Editor → Run. Idempotent.

alter table public.journal_entries
  add column if not exists entry_date date not null default ((now() at time zone 'Europe/Berlin')::date),
  add column if not exists entry_time time not null default ((now() at time zone 'Europe/Berlin')::time);

create index if not exists journal_entries_user_date_idx on public.journal_entries (user_id, entry_date desc);
