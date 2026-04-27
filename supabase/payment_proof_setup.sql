-- Storage and order column setup for GCash/bank payment proof uploads.
-- Run this in Supabase Dashboard > SQL Editor before using payment proof upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.orders
add column if not exists payment_proof_url text;

drop policy if exists "Payment proofs are readable by owner or admin" on storage.objects;
drop policy if exists "Payment proofs are publicly readable" on storage.objects;
create policy "Payment proofs are publicly readable"
on storage.objects for select
using (bucket_id = 'payment-proofs');

drop policy if exists "Users can upload own payment proofs" on storage.objects;
drop policy if exists "Authenticated users can upload payment proofs" on storage.objects;
create policy "Authenticated users can upload payment proofs"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and auth.role() = 'authenticated'
);

drop policy if exists "Users can update own payment proofs" on storage.objects;
drop policy if exists "Authenticated users can update payment proofs" on storage.objects;
create policy "Authenticated users can update payment proofs"
on storage.objects for update
using (
  bucket_id = 'payment-proofs'
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'payment-proofs'
  and auth.role() = 'authenticated'
);
