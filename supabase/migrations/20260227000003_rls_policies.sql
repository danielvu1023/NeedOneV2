-- ============================================================
-- Migration 3: Row-Level Security policies
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles          enable row level security;
alter table public.parks             enable row level security;
alter table public.check_ins         enable row level security;
alter table public.friendships       enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications     enable row level security;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
-- Anyone can read any profile (needed for friend search, map avatars)
create policy "profiles_read_all"
  on public.profiles for select
  using (true);

-- Users can only insert their own profile row
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can only update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ------------------------------------------------------------
-- parks
-- ------------------------------------------------------------
-- Parks are public read-only
create policy "parks_read_all"
  on public.parks for select
  using (true);

-- ------------------------------------------------------------
-- check_ins
-- ------------------------------------------------------------
-- Anyone can read active check-ins (drives the map)
create policy "checkins_read_active"
  on public.check_ins for select
  using (expires_at > now());

-- Users can only insert their own check-in
create policy "checkins_insert_own"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

-- Users can only delete their own check-in
create policy "checkins_delete_own"
  on public.check_ins for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- friendships
-- ------------------------------------------------------------
-- Users can read friendships they are part of
create policy "friendships_read_own"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Users can only create requests where they are the requester
create policy "friendships_insert_own"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

-- Only the addressee can accept/update a friendship
create policy "friendships_update_addressee"
  on public.friendships for update
  using (auth.uid() = addressee_id);

-- Either party can delete (reject or unfriend)
create policy "friendships_delete_own"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ------------------------------------------------------------
-- push_subscriptions
-- ------------------------------------------------------------
-- Users can only read their own subscriptions
create policy "push_subs_read_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

-- Users can only insert their own subscription
create policy "push_subs_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

-- Users can only delete their own subscription
create policy "push_subs_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
-- Users can only read their own notifications
create policy "notifications_read_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can only update (mark read) their own notifications
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);
