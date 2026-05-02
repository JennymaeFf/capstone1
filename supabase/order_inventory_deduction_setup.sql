-- Run this in Supabase Dashboard > SQL Editor to enable one-time inventory
-- deduction when an admin marks an order as Completed.

alter table public.orders
add column if not exists inventory_deducted_at timestamptz;
