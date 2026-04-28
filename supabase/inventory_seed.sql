-- Starter inventory rows for the admin Stock List.
-- Run this in Supabase Dashboard > SQL Editor if Inventory is empty.

insert into public.inventory_items (name, inventory_type, quantity, unit, low_stock_level, package_scope)
select seed.name, seed.inventory_type, seed.quantity, seed.unit, seed.low_stock_level, seed.package_scope
from (
  values
  ('Blueberry Syrup', 'ingredient', 30.00, 'bottle', 5.00, null),
  ('Green Apple Syrup', 'ingredient', 30.00, 'bottle', 5.00, null),
  ('Strawberry Syrup', 'ingredient', 30.00, 'bottle', 5.00, null),
  ('Yakult', 'ingredient', 48.00, 'pcs', 12.00, null),
  ('Coffee Mix', 'ingredient', 25.00, 'pack', 5.00, null),
  ('Zagu Powder', 'ingredient', 20.00, 'pack', =4.00, null),
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
