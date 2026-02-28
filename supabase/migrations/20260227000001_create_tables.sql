-- ============================================================
-- Migration 1: Core tables
-- ============================================================

-- profiles (auto-populated by trigger on auth.users insert)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- parks
create table if not exists public.parks (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  lat         float not null,
  lng         float not null,
  description text,
  created_at  timestamptz default now()
);

-- check_ins (one active per user enforced in app layer)
create table if not exists public.check_ins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  park_id       uuid references public.parks(id) on delete cascade,
  checked_in_at timestamptz default now(),
  expires_at    timestamptz default (now() + interval '2 hours')
);

-- friendships
create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade,
  addressee_id uuid references public.profiles(id) on delete cascade,
  status       text check (status in ('pending', 'accepted')) default 'pending',
  created_at   timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- push_subscriptions
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz default now()
);

-- notifications
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  type       text not null, -- 'friend_request' | 'friend_accepted' | 'friend_checkin'
  actor_id   uuid references public.profiles(id),
  park_id    uuid references public.parks(id),
  read       boolean default false,
  created_at timestamptz default now()
);
