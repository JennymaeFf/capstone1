-- Storage setup for admin menu image uploads.
-- Run this in Supabase Dashboard > SQL Editor if menu image upload says
-- the menu-images bucket is not set up.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Menu images are publicly readable" on storage.objects;
create policy "Menu images are publicly readable"
on storage.objects for select
using (bucket_id = 'menu-images');

drop policy if exists "Admins can upload menu images" on storage.objects;
create policy "Admins can upload menu images"
on storage.objects for insert
with check (
  bucket_id = 'menu-images'
  and exists (
    select 1
    from public.app_users
    where app_users.id = auth.uid()
      and app_users.role = 'admin'
  )
);

drop policy if exists "Admins can update menu images" on storage.objects;
create policy "Admins can update menu images"
on storage.objects for update
using (
  bucket_id = 'menu-images'
  and exists (
    select 1
    from public.app_users
    where app_users.id = auth.uid()
      and app_users.role = 'admin'
  )
)
with check (
  bucket_id = 'menu-images'
  and exists (
    select 1
    from public.app_users
    where app_users.id = auth.uid()
      and app_users.role = 'admin'
  )
);

drop policy if exists "Admins can delete menu images" on storage.objects;
create policy "Admins can delete menu images"
on storage.objects for delete
using (
  bucket_id = 'menu-images'
  and exists (
    select 1
    from public.app_users
    where app_users.id = auth.uid()
      and app_users.role = 'admin'
  )
);
