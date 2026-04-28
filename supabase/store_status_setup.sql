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

-- Dedicated OTP storage. The app no longer stores OTPs in app_settings.
create table if not exists public.otp_verifications (
  key text primary key,
  email text not null,
  purpose text not null check (purpose in ('registration', 'login')),
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  resend_available_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.otp_verifications enable row level security;

insert into public.app_settings (key, value)
values ('store_status', '{"is_open": true, "message": ""}'::jsonb)
on conflict (key) do update
set value = case
  when (public.app_settings.value->>'message') = 'We are open and accepting orders.'
    then jsonb_set(public.app_settings.value, '{message}', '""'::jsonb)
  else public.app_settings.value
end;

-- General system settings used by checkout and future calculations.
-- Edit this row in Supabase to change values without changing code.
insert into public.app_settings (key, value)
values (
  'system_settings',
  '{"delivery_fee": 30, "tax_rate": 0, "restaurant_name": "Indabest Crave Corner"}'::jsonb
)
on conflict (key) do update
set value = public.app_settings.value || excluded.value;

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

-- Add-on order totals for receipts and admin reports.
do $$
begin
  if to_regclass('public.order_addons') is not null then
    execute 'alter table public.order_addons add column if not exists total_price numeric(10, 2) not null default 0';
  end if;
end $$;

-- menu_item_inventory is a friendly alias for menu_item_inventory_requirements.
-- Use this to link menu items to required ingredients:
-- Burger -> Bun (1), Patty (1), Cheese (1)
do $$
begin
  if to_regclass('public.menu_item_inventory_requirements') is not null then
    execute '
      create or replace view public.menu_item_inventory as
      select id, menu_item_id, inventory_item_id, quantity_required, created_at
      from public.menu_item_inventory_requirements
    ';
  end if;
end $$;

-- Allow customers to save add-ons connected to their own order items.
-- Safe to run even if order_addons is not created in this setup file yet.
do $$
begin
  if to_regclass('public.order_addons') is not null then
    execute 'drop policy if exists "Users can insert own order addons" on public.order_addons';
    execute '
      create policy "Users can insert own order addons"
      on public.order_addons for insert
      with check (
        exists (
          select 1
          from public.order_items oi
          join public.orders o on o.id = oi.order_id
          where oi.id = order_addons.order_item_id
            and o.user_id = auth.uid()
        )
      )
    ';
  end if;
end $$;
