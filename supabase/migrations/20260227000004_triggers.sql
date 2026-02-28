-- ============================================================
-- Migration 4: Triggers and functions
-- ============================================================

-- ------------------------------------------------------------
-- Auto-create profile row on signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, username)
  values (new.id, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Auto-create notification when a friend request is sent
-- ------------------------------------------------------------
create or replace function public.handle_friend_request()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications(user_id, type, actor_id)
  values (new.addressee_id, 'friend_request', new.requester_id);
  return new;
end;
$$;

create or replace trigger on_friendship_created
  after insert on public.friendships
  for each row execute function public.handle_friend_request();

-- ------------------------------------------------------------
-- Auto-create notification when a friend request is accepted
-- ------------------------------------------------------------
create or replace function public.handle_friend_accepted()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.notifications(user_id, type, actor_id)
    values (new.requester_id, 'friend_accepted', new.addressee_id);
  end if;
  return new;
end;
$$;

create or replace trigger on_friendship_accepted
  after update on public.friendships
  for each row execute function public.handle_friend_accepted();
