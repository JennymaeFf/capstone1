-- Supabase setup for INDABEST CRAVE CORNER.
-- Run this in Supabase Dashboard > SQL Editor.

create extension if not exists "pgcrypto";

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('store_status', '{"is_open": true, "message": ""}'::jsonb)
on conflict (key) do nothing;

insert into public.app_users (id, role)
select id, case when is_admin then 'admin' else 'customer' end
from public.profiles
on conflict (id) do update
set role = case
  when excluded.role = 'admin' then 'admin'
  else public.app_users.role
end;

insert into public.app_users (id, role)
select id, 'customer'
from auth.users
on conflict (id) do nothing;

create table if not exists public.categories (
  name text primary key,
  icon text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text not null,
  category text not null references public.categories(name) on update cascade,
  base_price numeric(10, 2) not null check (base_price >= 0),
  is_manually_available boolean not null default true,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  inventory_type text not null check (inventory_type in ('ingredient', 'packaging', 'addon', 'beverage')),
  quantity numeric(10, 2) not null default 0 check (quantity >= 0),
  unit text not null default 'pcs',
  low_stock_level numeric(10, 2) not null default 0 check (low_stock_level >= 0),
  package_scope text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_item_inventory_requirements (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity_required numeric(10, 2) not null check (quantity_required > 0),
  created_at timestamptz not null default now(),
  unique (menu_item_id, inventory_item_id)
);

create table if not exists public.menu_item_addons (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  price_delta numeric(10, 2) not null default 0 check (price_delta >= 0),
  quantity_required numeric(10, 2) not null default 1 check (quantity_required > 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (menu_item_id, inventory_item_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Pending'
    check (status in ('Pending', 'Preparing', 'Completed', 'Cancelled', 'On the way', 'Delivered')),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  subtotal_amount numeric(10, 2) not null default 0 check (subtotal_amount >= 0),
  phone text not null,
  address text not null,
  delivery_option text not null default 'Delivery' check (delivery_option in ('Delivery', 'Pickup')),
  delivery_distance_km numeric(10, 2) not null default 0 check (delivery_distance_km >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  payment_method text not null default 'Cash on Delivery'
    check (payment_method in ('Cash on Delivery', 'GCash', 'Card/Bank', 'Maya')),
  selected_bank text check (selected_bank is null or selected_bank in ('Landbank', 'BDO', 'BPI')),
  payment_reference text,
  payment_proof_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  image_url text not null,
  size_label text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.order_addons (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  addon_name text not null,
  price_delta numeric(10, 2) not null default 0,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

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

alter table public.menu_items
add column if not exists is_manually_available boolean not null default true;

alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check
check (status in ('Pending', 'Preparing', 'Completed', 'Cancelled', 'On the way', 'Delivered'));

alter table public.orders
add column if not exists subtotal_amount numeric(10, 2) not null default 0;

alter table public.orders
add column if not exists delivery_option text not null default 'Delivery';

alter table public.orders
add column if not exists delivery_distance_km numeric(10, 2) not null default 0;

alter table public.orders
add column if not exists delivery_fee numeric(10, 2) not null default 0;

alter table public.orders
add column if not exists selected_bank text;

alter table public.orders
add column if not exists payment_reference text;

alter table public.orders
add column if not exists payment_proof_url text;

alter table public.profiles
add column if not exists avatar_url text;

alter table public.contact_messages
add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.contact_messages
add column if not exists admin_reply text;

alter table public.contact_messages
add column if not exists customer_reply text;

alter table public.contact_messages
add column if not exists status text not null default 'Unread';

alter table public.contact_messages
add column if not exists customer_seen boolean not null default true;

alter table public.contact_messages
add column if not exists replied_at timestamptz;

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

alter table public.orders
drop constraint if exists orders_subtotal_amount_check;

alter table public.orders
add constraint orders_subtotal_amount_check
check (subtotal_amount >= 0);

alter table public.orders
drop constraint if exists orders_delivery_option_check;

alter table public.orders
add constraint orders_delivery_option_check
check (delivery_option in ('Delivery', 'Pickup'));

alter table public.orders
drop constraint if exists orders_delivery_distance_km_check;

alter table public.orders
add constraint orders_delivery_distance_km_check
check (delivery_distance_km >= 0);

alter table public.orders
drop constraint if exists orders_delivery_fee_check;

alter table public.orders
add constraint orders_delivery_fee_check
check (delivery_fee >= 0);

alter table public.orders
drop constraint if exists orders_selected_bank_check;

alter table public.orders
add constraint orders_selected_bank_check
check (selected_bank is null or selected_bank in ('Landbank', 'BDO', 'BPI'));

alter table public.orders
drop constraint if exists orders_payment_method_check;

alter table public.orders
add constraint orders_payment_method_check
check (payment_method in ('Cash on Delivery', 'GCash', 'Card/Bank', 'Maya'));

-- Remove duplicate menu items before adding the unique index.
-- Keeps the oldest row for each item name and deletes later duplicates.
with ranked_menu_items as (
  select
    id,
    row_number() over (
      partition by lower(trim(name))
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.menu_items
)
delete from public.menu_items menu_item
using ranked_menu_items ranked
where menu_item.id = ranked.id
  and ranked.duplicate_rank > 1;

create index if not exists menu_items_category_idx on public.menu_items(category);
create unique index if not exists menu_items_unique_name_idx on public.menu_items (lower(trim(name)));
create index if not exists categories_display_order_idx on public.categories(display_order);
create index if not exists orders_user_id_created_at_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists inventory_items_type_idx on public.inventory_items(inventory_type);
create index if not exists inventory_items_low_stock_idx on public.inventory_items(inventory_type, quantity, low_stock_level);
create index if not exists menu_item_requirements_menu_idx on public.menu_item_inventory_requirements(menu_item_id);
create index if not exists menu_item_requirements_inventory_idx on public.menu_item_inventory_requirements(inventory_item_id);
create index if not exists menu_item_addons_menu_idx on public.menu_item_addons(menu_item_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

create or replace function public.sync_menu_item_availability(p_menu_item_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.menu_items mi
  set is_available = mi.is_manually_available
    and not exists (
      select 1
      from public.menu_item_inventory_requirements req
      join public.inventory_items inv on inv.id = req.inventory_item_id
      where req.menu_item_id = mi.id
        and (not inv.is_active or inv.quantity < req.quantity_required)
    )
  where p_menu_item_id is null or mi.id = p_menu_item_id;

  update public.menu_item_addons addon
  set is_available = inv.is_active and inv.quantity >= addon.quantity_required
  from public.inventory_items inv
  where inv.id = addon.inventory_item_id
    and (p_menu_item_id is null or addon.menu_item_id = p_menu_item_id);
end;
$$;

create or replace function public.sync_menu_item_availability_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_menu_item_availability(null);
  return coalesce(new, old);
end;
$$;

drop trigger if exists inventory_sync_menu_availability on public.inventory_items;
create trigger inventory_sync_menu_availability
after insert or update or delete on public.inventory_items
for each row execute function public.sync_menu_item_availability_trigger();

drop trigger if exists requirements_sync_menu_availability on public.menu_item_inventory_requirements;
create trigger requirements_sync_menu_availability
after insert or update or delete on public.menu_item_inventory_requirements
for each row execute function public.sync_menu_item_availability_trigger();

drop trigger if exists menu_items_manual_sync_availability on public.menu_items;
create trigger menu_items_manual_sync_availability
after update of is_manually_available on public.menu_items
for each row execute function public.sync_menu_item_availability_trigger();

create or replace function public.place_order_with_inventory(
  p_phone text,
  p_address text,
  p_payment_method text,
  p_total_amount numeric,
  p_items jsonb,
  p_subtotal_amount numeric default 0,
  p_delivery_option text default 'Delivery',
  p_delivery_distance_km numeric default 0,
  p_delivery_fee numeric default 0,
  p_selected_bank text default null,
  p_payment_reference text default null,
  p_payment_proof_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_item_id uuid;
  v_item jsonb;
  v_addon jsonb;
  v_menu_item_id uuid;
  v_quantity integer;
  v_name text;
  v_image text;
  v_size text;
  v_unit_price numeric;
  v_shortage text;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in to place an order.';
  end if;

  if coalesce(
    (select (value->>'is_open')::boolean from public.app_settings where key = 'store_status'),
    true
  ) = false then
    raise exception '%', coalesce(
      (select value->>'message' from public.app_settings where key = 'store_status'),
      'Store is closed right now.'
    );
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  perform public.sync_menu_item_availability(null);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_menu_item_id := nullif(v_item->>'menu_item_id', '')::uuid;
    v_quantity := greatest((v_item->>'quantity')::integer, 1);

    select name into v_shortage
    from public.menu_items
    where id = v_menu_item_id and not is_available
    limit 1;

    if v_shortage is not null then
      raise exception '% is unavailable.', v_shortage;
    end if;

    select inv.name into v_shortage
    from public.menu_item_inventory_requirements req
    join public.inventory_items inv on inv.id = req.inventory_item_id
    where req.menu_item_id = v_menu_item_id
      and (not inv.is_active or inv.quantity < req.quantity_required * v_quantity)
    limit 1;

    if v_shortage is not null then
      raise exception 'Not enough stock for %.', v_shortage;
    end if;

    for v_addon in select * from jsonb_array_elements(coalesce(v_item->'addons', '[]'::jsonb))
    loop
      select inv.name into v_shortage
      from public.inventory_items inv
      where inv.id = (v_addon->>'inventory_item_id')::uuid
        and (not inv.is_active or inv.quantity < (v_addon->>'quantity_required')::numeric * v_quantity)
      limit 1;

      if v_shortage is not null then
        raise exception 'Not enough stock for %.', v_shortage;
      end if;
    end loop;
  end loop;

  insert into public.orders (
    user_id,
    status,
    subtotal_amount,
    total_amount,
    phone,
    address,
    delivery_option,
    delivery_distance_km,
    delivery_fee,
    payment_method,
    selected_bank,
    payment_reference,
    payment_proof_url
  )
  values (
    auth.uid(),
    'Pending',
    p_subtotal_amount,
    p_total_amount,
    p_phone,
    p_address,
    p_delivery_option,
    p_delivery_distance_km,
    p_delivery_fee,
    p_payment_method,
    p_selected_bank,
    p_payment_reference,
    p_payment_proof_url
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_menu_item_id := nullif(v_item->>'menu_item_id', '')::uuid;
    v_quantity := greatest((v_item->>'quantity')::integer, 1);
    v_name := v_item->>'item_name';
    v_image := v_item->>'image_url';
    v_size := nullif(v_item->>'size_label', '');
    v_unit_price := (v_item->>'unit_price')::numeric;

    insert into public.order_items (order_id, menu_item_id, item_name, image_url, size_label, unit_price, quantity)
    values (v_order_id, v_menu_item_id, v_name, v_image, v_size, v_unit_price, v_quantity)
    returning id into v_order_item_id;

    update public.inventory_items inv
    set quantity = inv.quantity - (req.quantity_required * v_quantity)
    from public.menu_item_inventory_requirements req
    where req.inventory_item_id = inv.id
      and req.menu_item_id = v_menu_item_id;

    for v_addon in select * from jsonb_array_elements(coalesce(v_item->'addons', '[]'::jsonb))
    loop
      insert into public.order_addons (order_item_id, inventory_item_id, addon_name, price_delta, quantity)
      values (
        v_order_item_id,
        (v_addon->>'inventory_item_id')::uuid,
        v_addon->>'addon_name',
        (v_addon->>'price_delta')::numeric,
        v_quantity
      );

      update public.inventory_items
      set quantity = quantity - ((v_addon->>'quantity_required')::numeric * v_quantity)
      where id = (v_addon->>'inventory_item_id')::uuid;
    end loop;
  end loop;

  perform public.sync_menu_item_availability(null);
  return v_order_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update
    set full_name = excluded.full_name,
        updated_at = now();

  insert into public.app_users (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.app_users enable row level security;
alter table public.app_settings enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_items enable row level security;
alter table public.menu_item_inventory_requirements enable row level security;
alter table public.menu_item_addons enable row level security;
alter table public.order_addons enable row level security;
alter table public.contact_messages enable row level security;

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

drop policy if exists "Menu images are publicly readable" on storage.objects;
create policy "Menu images are publicly readable"
on storage.objects for select
using (bucket_id = 'menu-images');

drop policy if exists "Admins can upload menu images" on storage.objects;
create policy "Admins can upload menu images"
on storage.objects for insert
with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "Admins can update menu images" on storage.objects;
create policy "Admins can update menu images"
on storage.objects for update
using (bucket_id = 'menu-images' and public.is_admin())
with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "Admins can delete menu images" on storage.objects;
create policy "Admins can delete menu images"
on storage.objects for delete
using (bucket_id = 'menu-images' and public.is_admin());

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

drop policy if exists "Users can view own app user row" on public.app_users;
create policy "Users can view own app user row"
on public.app_users for select
using (auth.uid() = id or public.is_admin());

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

drop policy if exists "Admins can insert app users" on public.app_users;
create policy "Admins can insert app users"
on public.app_users for insert
with check (public.is_admin());

drop policy if exists "Users can insert own customer app user row" on public.app_users;
create policy "Users can insert own customer app user row"
on public.app_users for insert
with check (auth.uid() = id and role = 'customer');

drop policy if exists "Admins can update app users" on public.app_users;
create policy "Admins can update app users"
on public.app_users for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Profiles are viewable by owner or admin" on public.profiles;
create policy "Profiles are viewable by owner or admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "Menu is readable by everyone" on public.menu_items;
create policy "Menu is readable by everyone"
on public.menu_items for select
using (true);

drop policy if exists "Admins can insert menu items" on public.menu_items;
create policy "Admins can insert menu items"
on public.menu_items for insert
with check (public.is_admin());

drop policy if exists "Admins can update menu items" on public.menu_items;
create policy "Admins can update menu items"
on public.menu_items for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete menu items" on public.menu_items;
create policy "Admins can delete menu items"
on public.menu_items for delete
using (public.is_admin());

drop policy if exists "Categories are readable by everyone" on public.categories;
create policy "Categories are readable by everyone"
on public.categories for select
using (true);

drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
on public.categories for insert
with check (public.is_admin());

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
on public.categories for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories"
on public.categories for delete
using (public.is_admin());

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
on public.orders for select
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
on public.orders for insert
with check (auth.uid() = user_id);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can delete own orders" on public.orders;
create policy "Users can delete own orders"
on public.orders for delete
using (auth.uid() = user_id or public.is_admin());

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

drop policy if exists "Users can view own order items" on public.order_items;
create policy "Users can view own order items"
on public.order_items for select
using (
  public.is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "Users can create items for own orders" on public.order_items;
create policy "Users can create items for own orders"
on public.order_items for insert
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update order items" on public.order_items;
create policy "Admins can update order items"
on public.order_items for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can delete own order items" on public.order_items;
create policy "Users can delete own order items"
on public.order_items for delete
using (
  public.is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "Inventory readable by everyone" on public.inventory_items;
create policy "Inventory readable by everyone"
on public.inventory_items for select
using (true);

drop policy if exists "Admins manage inventory" on public.inventory_items;
create policy "Admins manage inventory"
on public.inventory_items for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Requirements readable by everyone" on public.menu_item_inventory_requirements;
create policy "Requirements readable by everyone"
on public.menu_item_inventory_requirements for select
using (true);

drop policy if exists "Admins manage requirements" on public.menu_item_inventory_requirements;
create policy "Admins manage requirements"
on public.menu_item_inventory_requirements for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Menu addons readable by everyone" on public.menu_item_addons;
create policy "Menu addons readable by everyone"
on public.menu_item_addons for select
using (true);

drop policy if exists "Admins manage menu addons" on public.menu_item_addons;
create policy "Admins manage menu addons"
on public.menu_item_addons for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can view own order addons" on public.order_addons;
create policy "Users can view own order addons"
on public.order_addons for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = order_addons.order_item_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own order addons" on public.order_addons;
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
);

insert into public.categories (name, icon, display_order)
values
  ('Lemonade Series', 'lemon', 10),
  ('Float Series', 'cup-soda', 20),
  ('Macchiato', 'coffee', 30),
  ('Zagu Delight', 'cup-soda', 40),
  ('Pizza', 'pizza', 50),
  ('Silog Combo Meals', 'utensils', 60),
  ('Bites Express', 'drumstick', 70),
  ('Extras', 'plus', 80),
  ('Siopao', 'sandwich', 90),
  ('Beers', 'beer', 100)
on conflict (name) do update
set icon = excluded.icon,
    display_order = excluded.display_order;

insert into public.menu_items (name, image_url, category, base_price, description)
select seed.name, seed.image_url, seed.category, seed.base_price, seed.description
from (
  values
  ('Blueberry Lemonade', '/blueberry.png', 'Lemonade Series', 39.00, 'Fresh and delicious Blueberry Lemonade made with quality ingredients.'),
  ('Green Apple Lemonade', '/greenapple.png', 'Lemonade Series', 39.00, 'Fresh and delicious Green Apple Lemonade made with quality ingredients.'),
  ('Yakult Lemonade', '/yakult.png', 'Lemonade Series', 39.00, 'Fresh and delicious Yakult Lemonade made with quality ingredients.'),
  ('Strawberry Lemonade', '/strawberry.png', 'Lemonade Series', 39.00, 'Fresh and delicious Strawberry Lemonade made with quality ingredients.'),
  ('Blueberry Float', '/blueberryfloat.png', 'Float Series', 49.00, 'Fresh and delicious Blueberry Float made with quality ingredients.'),
  ('Strawberry Float', '/strawberryfloat.png', 'Float Series', 49.00, 'Fresh and delicious Strawberry Float made with quality ingredients.'),
  ('Green Apple Float', '/greenapplefloat.png', 'Float Series', 49.00, 'Fresh and delicious Green Apple Float made with quality ingredients.'),
  ('Coke Float', '/cokefloat.png', 'Float Series', 49.00, 'Fresh and delicious Coke Float made with quality ingredients.'),
  ('Sprite Float', '/spritefloat.png', 'Float Series', 49.00, 'Fresh and delicious Sprite Float made with quality ingredients.'),
  ('Macchiato Caramel', '/macchiatocaramel.png', 'Macchiato', 39.00, 'Fresh and delicious Macchiato Caramel made with quality ingredients.'),
  ('Macchiato Dark Chocolate', '/macchiatodarkchoco.png', 'Macchiato', 39.00, 'Fresh and delicious Macchiato Dark Chocolate made with quality ingredients.'),
  ('Macchiato Strawberry', '/macchiatostrawberry.png', 'Macchiato', 39.00, 'Fresh and delicious Macchiato Strawberry made with quality ingredients.'),
  ('Ube Zagu Shake', '/ubeshake.png', 'Zagu Delight', 39.00, 'Fresh and delicious Ube Zagu Shake made with quality ingredients.'),
  ('Mango Zagu Shake', '/mangoshake.png', 'Zagu Delight', 39.00, 'Fresh and delicious Mango Zagu Shake made with quality ingredients.'),
  ('Hawaiian Pizza', '/hawaiianpizza.png', 'Pizza', 120.00, 'Fresh and delicious Hawaiian Pizza made with quality ingredients.'),
  ('Pepperoni Pizza', '/pepperoni.png', 'Pizza', 120.00, 'Fresh and delicious Pepperoni Pizza made with quality ingredients.'),
  ('Fish Ball', '/fishball.png', 'Bites Express', 20.00, 'Fresh and delicious Fish Ball made with quality ingredients.'),
  ('Tempura', '/tempura.png', 'Bites Express', 20.00, 'Fresh and delicious Tempura made with quality ingredients.'),
  ('Indabest Fries', '/frenchfries.png', 'Bites Express', 30.00, 'Fresh and delicious Indabest Fries made with quality ingredients.'),
  ('Japanese Siomai', '/japanesesiomai.png', 'Extras', 9.00, 'Fresh and delicious Japanese Siomai made with quality ingredients.'),
  ('Ngohiong', '/ngohiong.png', 'Extras', 15.00, 'Fresh and delicious Ngohiong made with quality ingredients.'),
  ('Regular Siomai', '/regularsiomai.png', 'Extras', 15.00, 'Fresh and delicious Regular Siomai made with quality ingredients.'),
  ('Corn Silog', '/cornsilog.png', 'Silog Combo Meals', 49.00, 'Fresh and delicious Corn Silog made with quality ingredients.'),
  ('Ham Silog', '/hamsilog.png', 'Silog Combo Meals', 49.00, 'Fresh and delicious Ham Silog made with quality ingredients.'),
  ('Hot Silog', '/hotsilog.png', 'Silog Combo Meals', 49.00, 'Fresh and delicious Hot Silog made with quality ingredients.'),
  ('Long Silog', '/longsilog.png', 'Silog Combo Meals', 49.00, 'Fresh and delicious Long Silog made with quality ingredients.'),
  ('Lumpia Silog', '/lumpiasilog.png', 'Silog Combo Meals', 49.00, 'Fresh and delicious Lumpia Silog made with quality ingredients.'),
  ('Luncheon Silog', '/luncheonsilog.png', 'Silog Combo Meals', 49.00, 'Fresh and delicious Luncheon Silog made with quality ingredients.'),
  ('Pancit Canton', '/pancitcanton.png', 'Extras', 25.00, 'Fresh and delicious Pancit Canton made with quality ingredients.'),
  ('Noodles', '/noodles.png', 'Extras', 35.00, 'Fresh and delicious Noodles made with quality ingredients.'),
  ('Cup Noodles', '/cupnoodles.png', 'Extras', 45.00, 'Fresh and delicious Cup Noodles made with quality ingredients.'),
  ('Asado Siopao', '/asado.png', 'Siopao', 45.00, 'Fresh and delicious Asado Siopao made with quality ingredients.'),
  ('Bola-Bola Siopao', '/bolabola.png', 'Siopao', 45.00, 'Fresh and delicious Bola-Bola Siopao made with quality ingredients.'),
  ('Red Horse Beer', '/redhorse.png', 'Beers', 130.00, 'Fresh and delicious Red Horse Beer.'),
  ('Smirnoff', '/smirnoff.png', 'Beers', 90.00, 'Fresh and delicious Smirnoff.'),
  ('Tanduay Ice', '/tanduayice.png', 'Beers', 70.00, 'Fresh and delicious Tanduay Ice.')
) as seed(name, image_url, category, base_price, description)
where not exists (
  select 1
  from public.menu_items existing
  where lower(trim(existing.name)) = lower(trim(seed.name))
);

insert into public.inventory_items (name, inventory_type, quantity, unit, low_stock_level, package_scope)
select seed.name, seed.inventory_type, seed.quantity, seed.unit, seed.low_stock_level, seed.package_scope
from (
  values
  ('Blueberry Syrup', 'ingredient', 30.00, 'bottle', 5.00, null),
  ('Green Apple Syrup', 'ingredient', 30.00, 'bottle', 5.00, null),
  ('Strawberry Syrup', 'ingredient', 30.00, 'bottle', 5.00, null),
  ('Yakult', 'ingredient', 48.00, 'pcs', 12.00, null),
  ('Coffee Mix', 'ingredient', 25.00, 'pack', 5.00, null),
  ('Zagu Powder', 'ingredient', 20.00, 'pack', 4.00, null),
  ('Pizza Dough', 'ingredient', 25.00, 'pcs', 5.00, null),
  ('Pizza Toppings', 'ingredient', 20.00, 'set', 4.00, null),
  ('Rice', 'ingredient', 50.00, 'serving', 10.00, null),
  ('Silog Meat', 'ingredient', 40.00, 'serving', 8.00, null),
  ('Fish Ball', 'ingredient', 80.00, 'pcs', 20.00, null),
  ('Tempura', 'ingredient', 80.00, 'pcs', 20.00, null),
  ('Siomai', 'ingredient', 100.00, 'pcs', 20.00, null),
  ('Siopao', 'ingredient', 30.00, 'pcs', 8.00, null),
  ('French Fries', 'ingredient', 20.00, 'pack', 4.00, null),
  ('Cup Noodles', 'ingredient', 24.00, 'pcs', 6.00, null),
  ('Red Horse Beer', 'beverage', 24.00, 'bottle', 6.00, null),
  ('Smirnoff', 'beverage', 24.00, 'bottle', 6.00, null),
  ('Tanduay Ice', 'beverage', 24.00, 'bottle', 6.00, null),
  ('Plastic Cups', 'packaging', 200.00, 'pcs', 40.00, 'drinks'),
  ('Food Boxes', 'packaging', 100.00, 'pcs', 20.00, 'meals'),
  ('Paper Bags', 'packaging', 100.00, 'pcs', 20.00, 'orders'),
  ('Cheese Add-on', 'addon', 50.00, 'serving', 10.00, null),
  ('Extra Rice', 'addon', 50.00, 'serving', 10.00, null),
  ('Pearls Add-on', 'addon', 40.00, 'serving', 8.00, null)
) as seed(name, inventory_type, quantity, unit, low_stock_level, package_scope)
where not exists (
  select 1
  from public.inventory_items existing
  where lower(trim(existing.name)) = lower(trim(seed.name))
);

-- After creating your own user, make that user an admin with:
-- update public.app_users set role = 'admin' where id = 'YOUR_USER_ID';
