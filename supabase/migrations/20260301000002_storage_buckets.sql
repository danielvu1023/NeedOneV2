-- Create storage buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- RLS: allow public read
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- RLS: allow users to upload to their own folder
create policy "avatars user upload"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: allow users to update their own files
create policy "avatars user update"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
