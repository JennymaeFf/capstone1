-- Contact message setup for customer/admin replies.
-- Run this in Supabase Dashboard > SQL Editor if Contact Us or admin Messages says
-- the contact_messages table is not set up.

create extension if not exists "pgcrypto";

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.app_users where id = auth.uid()),
    false
  );
$$;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  message text not null check (char_length(message) <= 1000),
  admin_reply text,
  customer_reply text,
  status text not null default 'Unread' check (status in ('Unread', 'Read', 'Replied')),
  customer_seen boolean not null default true,
  created_at timestamptz not null default now(),
  replied_at timestamptz,
  customer_replied_at timestamptz
);

alter table public.contact_messages enable row level security;

alter table public.contact_messages
add column if not exists customer_reply text;

alter table public.contact_messages
add column if not exists customer_replied_at timestamptz;

alter table public.contact_messages
drop constraint if exists contact_messages_message_length_check;

alter table public.contact_messages
add constraint contact_messages_message_length_check
check (char_length(message) <= 1000);

create index if not exists contact_messages_user_id_created_at_idx
on public.contact_messages (user_id, created_at desc);

create index if not exists contact_messages_status_created_at_idx
on public.contact_messages (status, created_at desc);

drop policy if exists "Users can create own contact messages" on public.contact_messages;
create policy "Users can create own contact messages"
on public.contact_messages for insert
with check (auth.uid() = user_id);

drop policy if exists "Users and admins can view contact messages" on public.contact_messages;
create policy "Users and admins can view contact messages"
on public.contact_messages for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Admins can update contact messages"
on public.contact_messages for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can mark own contact messages seen" on public.contact_messages;
create policy "Users can mark own contact messages seen"
on public.contact_messages for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
