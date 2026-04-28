-- Store open/closed setting for admin dashboard.
-- Run this in Supabase Dashboard > SQL Editor if the store toggle is missing or errors.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('store_status', '{"is_open": true, "message": ""}'::jsonb)
on conflict (key) do update
set value = case
  when (public.app_settings.value->>'message') = 'We are open and accepting orders.'
    then jsonb_set(public.app_settings.value, '{message}', '""'::jsonb)
  else public.app_settings.value
end;

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

drop policy if exists "App settings are readable by everyone" on public.app_settings;
create policy "App settings are readable by everyone"
on public.app_settings for select
using (true);

drop policy if exists "Admins can update app settings" on public.app_settings;
create policy "Admins can update app settings"
on public.app_settings for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can insert app settings" on public.app_settings;
create policy "Admins can insert app settings"
on public.app_settings for insert
with check (public.is_admin());
