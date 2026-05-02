-- Run this in Supabase Dashboard > SQL Editor to enable one-time inventory
-- deduction when an admin marks an order as Completed.

alter table public.orders
add column if not exists inventory_deducted boolean default false;

-- Make sure Japanese Siomai has a concrete inventory stock row.
insert into public.inventory_items (name, inventory_type, quantity, unit, low_stock_level, package_scope)
select 'Japanese Siomai', 'ingredient', 100.00, 'pcs', 20.00, null
where not exists (
  select 1
  from public.inventory_items
  where lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = lower('Japanese Siomai')
);

-- Link the Japanese Siomai menu item to its inventory row so deduction uses menu_item_id.
insert into public.menu_item_inventory_requirements (menu_item_id, inventory_item_id, quantity_required)
select menu.id, inventory.id, 1
from public.menu_items menu
join public.inventory_items inventory
  on lower(regexp_replace(trim(inventory.name), '\s+', ' ', 'g')) = lower('Japanese Siomai')
where lower(regexp_replace(trim(menu.name), '\s+', ' ', 'g')) = lower('Japanese Siomai')
on conflict (menu_item_id, inventory_item_id) do update
set quantity_required = excluded.quantity_required;
