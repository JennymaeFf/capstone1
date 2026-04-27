-- Storage and profile setup for customer profile pictures.
-- Run this in Supabase Dashboard > SQL Editor if profile picture upload says
-- the profile-pictures bucket or avatar_url column is not set up.

alter table public.profiles
add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-pictures',
  'profile-pictures',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Profile pictures are publicly readable" on storage.objects;
create policy "Profile pictures are publicly readable"
on storage.objects for select
using (bucket_id = 'profile-pictures');

drop policy if exists "Users can upload own profile pictures" on storage.objects;
create policy "Users can upload own profile pictures"
on storage.objects for insert
with check (
  bucket_id = 'profile-pictures'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own profile pictures" on storage.objects;
create policy "Users can update own profile pictures"
on storage.objects for update
using (
  bucket_id = 'profile-pictures'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-pictures'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
