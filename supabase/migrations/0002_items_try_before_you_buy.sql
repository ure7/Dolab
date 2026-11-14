-- =============================================================================
-- Dolab — phase 2: "try before you buy" fields on items
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run on a database that already has 0001_init.sql applied.
-- =============================================================================

alter table public.items
  -- 'owned' = in your wardrobe, 'not_owned' = seen in a shop, trying it out first
  add column status      text not null default 'owned' check (status in ('owned', 'not_owned')),
  add column store_name  text check (char_length(store_name) <= 60),
  add column price       numeric(10, 2) check (price >= 0),
  add column product_url text check (product_url ~* '^https?://' and char_length(product_url) <= 500),
  -- set when a not-owned item is marked as bought
  add column bought_at   timestamptz;

-- The wardrobe page filters by status a lot.
create index items_user_status_idx on public.items (user_id, status);
