create table if not exists feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete set null,
  category    text not null check (category in ('bug', 'feature', 'feedback')),
  message     text not null check (char_length(message) between 1 and 2000),
  created_at  timestamptz not null default now()
);

alter table feedback enable row level security;

-- Users can insert their own feedback; reads are service-role only
create policy "feedback_insert"
  on public.feedback for insert
  with check (user_id is null or (select auth.uid()) = user_id);

-- Index for querying by user
create index idx_feedback_user_id on public.feedback (user_id);
create index idx_feedback_created_at on public.feedback (created_at desc);
