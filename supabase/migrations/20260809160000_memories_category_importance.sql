-- Adds category/importance to memories so Ares can autonomously store facts
-- like: Category "Business", Content "Voltra ist aktuell Louis'
-- wichtigstes Businessprojekt.", Importance "High".
--
-- `type` gets a default so the automatic save-memory flow doesn't need to
-- supply it; `title` stays required but is now auto-derived from content in
-- code rather than asked of the model.
--
-- Run once in Supabase Dashboard → SQL Editor → Run. Idempotent.

alter table public.memories
  add column if not exists category text,
  add column if not exists importance text not null default 'normal'
    check (importance in ('low', 'normal', 'high', 'critical'));

alter table public.memories
  alter column type set default 'user';

create index if not exists memories_user_category_idx on public.memories (user_id, category);
create index if not exists memories_user_importance_idx on public.memories (user_id, importance);
