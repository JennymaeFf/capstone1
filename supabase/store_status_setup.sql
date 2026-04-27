-- Store open/closed setting for admin dashboard.
-- Run this in Supabase Dashboard > SQL Editor if the store toggle is missing or errors.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('store_status', '{"is_open": true, "message": "We are open and accepting orders."}'::jsonb)
on conflict (key) do nothing;

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
