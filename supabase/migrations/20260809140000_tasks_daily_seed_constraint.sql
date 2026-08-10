-- Prevents duplicate "Heutige Aufgaben" rows for the same day if the app
-- ever tries to seed the day's default tasks twice (e.g. two tabs loading
-- at once). Makes the seed-insert safe to upsert with ignoreDuplicates.
--
-- Run once in Supabase Dashboard → SQL Editor → Run. Idempotent.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_user_due_date_title_key'
  ) then
    alter table public.tasks
      add constraint tasks_user_due_date_title_key unique (user_id, due_date, title);
  end if;
end $$;
