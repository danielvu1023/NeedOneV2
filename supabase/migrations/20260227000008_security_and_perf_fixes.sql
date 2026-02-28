-- ============================================================
-- Fix 1: push_cooldowns — explicit deny policy so the advisor
-- doesn't flag "RLS enabled but no policies".
-- Service role bypasses RLS, so this just blocks anon/authed users.
-- ============================================================
create policy "push_cooldowns_no_user_access"
  on public.push_cooldowns
  as restrictive
  using (false);

-- ============================================================
-- Fix 2: RLS policies — use (select auth.uid()) instead of
-- auth.uid() directly, to avoid per-row re-evaluation.
-- ============================================================

-- profiles
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_insert_own"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- check_ins
drop policy if exists "checkins_insert_own" on public.check_ins;
drop policy if exists "checkins_delete_own" on public.check_ins;

create policy "checkins_insert_own"
  on public.check_ins for insert
  with check ((select auth.uid()) = user_id);

create policy "checkins_delete_own"
  on public.check_ins for delete
  using ((select auth.uid()) = user_id);

-- friendships
drop policy if exists "friendships_read_own" on public.friendships;
drop policy if exists "friendships_insert_own" on public.friendships;
drop policy if exists "friendships_update_addressee" on public.friendships;
drop policy if exists "friendships_delete_own" on public.friendships;

create policy "friendships_read_own"
  on public.friendships for select
  using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

create policy "friendships_insert_own"
  on public.friendships for insert
  with check ((select auth.uid()) = requester_id);

create policy "friendships_update_addressee"
  on public.friendships for update
  using ((select auth.uid()) = addressee_id);

create policy "friendships_delete_own"
  on public.friendships for delete
  using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

-- push_subscriptions
drop policy if exists "push_subs_read_own" on public.push_subscriptions;
drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
drop policy if exists "push_subs_delete_own" on public.push_subscriptions;

create policy "push_subs_read_own"
  on public.push_subscriptions for select
  using ((select auth.uid()) = user_id);

create policy "push_subs_insert_own"
  on public.push_subscriptions for insert
  with check ((select auth.uid()) = user_id);

create policy "push_subs_delete_own"
  on public.push_subscriptions for delete
  using ((select auth.uid()) = user_id);

-- notifications
drop policy if exists "notifications_read_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;

create policy "notifications_read_own"
  on public.notifications for select
  using ((select auth.uid()) = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using ((select auth.uid()) = user_id);

-- ============================================================
-- Fix 3: Lock search_path on all public functions
-- ============================================================
alter function public.handle_new_user() set search_path = public;
alter function public.handle_friend_request() set search_path = public;
alter function public.handle_friend_accepted() set search_path = public;
alter function public.get_friend_ids(uuid) set search_path = public;
alter function public.get_court_peers(uuid) set search_path = public;

-- ============================================================
-- Fix 4: Add indexes on unindexed foreign keys
-- ============================================================
create index if not exists idx_check_ins_user_id      on public.check_ins (user_id);
create index if not exists idx_check_ins_park_id      on public.check_ins (park_id);
create index if not exists idx_friendships_addressee  on public.friendships (addressee_id);
create index if not exists idx_notifications_user_id  on public.notifications (user_id);
create index if not exists idx_notifications_actor_id on public.notifications (actor_id);
create index if not exists idx_notifications_park_id  on public.notifications (park_id);
create index if not exists idx_push_subs_user_id      on public.push_subscriptions (user_id);
create index if not exists idx_push_cooldowns_recip   on public.push_cooldowns (recipient_id);
