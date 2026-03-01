-- ============================================================
-- Migration 5: Realtime publication + pg_cron cleanup
-- ============================================================

-- Add tables that need real-time updates to the publication
alter publication supabase_realtime add table public.check_ins;
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.notifications;

-- ------------------------------------------------------------
-- pg_cron: delete expired check-ins every minute
-- Fires Realtime DELETE events so clients remove stale markers
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'delete-expired-checkins',
      '* * * * *',
      'delete from public.check_ins where expires_at <= now()'
    );
  end if;
end $$;
