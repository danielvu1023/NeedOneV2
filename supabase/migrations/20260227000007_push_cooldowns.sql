create table if not exists push_cooldowns (
  notifier_id  uuid references profiles(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete cascade,
  sent_at      timestamptz not null default now(),
  primary key (notifier_id, recipient_id)
);
alter table push_cooldowns enable row level security;
-- service role only — no user-facing RLS policy needed
