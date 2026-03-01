-- Add unique constraint on endpoint so upsert with onConflict: 'endpoint' works.
alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_key unique (endpoint);
