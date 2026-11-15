-- =============================================================================
-- Dolab — phases 4–7: everything the remaining features need, in one go.
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again (every step checks whether it was already done).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Phase 4 — outfits: remember "Jacket open / Jacket closed" per outfit
-- -----------------------------------------------------------------------------
alter table public.outfits
  add column if not exists jacket_open boolean not null default true;


-- -----------------------------------------------------------------------------
-- Phase 5 — shopping list: an entry can point at a "not owned yet" wardrobe
-- item (so "I bought it" can update both). Deleting the item keeps the entry.
-- -----------------------------------------------------------------------------
alter table public.shopping_items
  add column if not exists item_id uuid references public.items (id) on delete set null;

-- One shopping-list entry per wardrobe item.
create unique index if not exists shopping_items_item_id_key
  on public.shopping_items (item_id) where item_id is not null;

-- Same policy as before, plus: a linked item must be your own.
drop policy if exists "Own shopping items: all" on public.shopping_items;
create policy "Own shopping items: all" on public.shopping_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (item_id is null
         or exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())))
  );


-- -----------------------------------------------------------------------------
-- Phase 7 — wear tracker: one row per item per day you wore it
-- -----------------------------------------------------------------------------
create table if not exists public.wear_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id    uuid not null references public.items (id) on delete cascade,
  outfit_id  uuid references public.outfits (id) on delete set null,  -- which outfit, if any
  worn_on    date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, item_id, worn_on)  -- pressing "Wore it today" twice counts once
);

create index if not exists wear_logs_user_day_idx on public.wear_logs (user_id, worn_on desc);
create index if not exists wear_logs_item_id_idx  on public.wear_logs (item_id);

alter table public.wear_logs enable row level security;

drop policy if exists "Own wear logs: all" on public.wear_logs;
create policy "Own wear logs: all" on public.wear_logs for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
    and (outfit_id is null
         or exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid())))
  );

grant select, insert, delete on public.wear_logs to authenticated;


-- -----------------------------------------------------------------------------
-- Phase 7 — share an outfit with a public, read-only link.
-- An outfit is shared while it has a share_token (a long random code made by
-- the app). Visitors without an account can see ONLY that outfit, through the
-- function below — never the tables themselves.
-- -----------------------------------------------------------------------------
alter table public.outfits
  add column if not exists share_token text unique
    check (share_token ~ '^[A-Za-z0-9_-]{20,64}$');

-- Returns one shared outfit (name, code, jacket setting, items) or null.
-- security definer = runs with the owner's rights, so it can read the rows,
-- but it only ever returns the outfit whose secret token was given.
create or replace function public.get_shared_outfit(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'code',        o.code,
    'name',        o.name,
    'jacket_open', o.jacket_open,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'name', i.name, 'category', i.category, 'colour', i.colour,
        'status', i.status, 'photo_path', i.photo_path, 'cutout_path', i.cutout_path))
      from public.outfit_items oi
      join public.items i on i.id = oi.item_id
      where oi.outfit_id = o.id), '[]'::jsonb)
  )
  from public.outfits o
  where p_token is not null and o.share_token = p_token;
$$;

revoke all on function public.get_shared_outfit(text) from public;
grant execute on function public.get_shared_outfit(text) to anon, authenticated;

-- Is this photo part of a shared outfit? (Used by the storage rule below.)
create or replace function public.is_shared_photo(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.outfits o
    join public.outfit_items oi on oi.outfit_id = o.id
    join public.items i on i.id = oi.item_id
    where o.share_token is not null
      and (i.photo_path = p_path or i.cutout_path = p_path)
  );
$$;

revoke all on function public.is_shared_photo(text) from public;
grant execute on function public.is_shared_photo(text) to anon, authenticated;

-- Photos stay private, EXCEPT the photos of items in a shared outfit.
drop policy if exists "Shared outfit photos: read" on storage.objects;
create policy "Shared outfit photos: read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'item-photos' and public.is_shared_photo(name));


-- -----------------------------------------------------------------------------
-- Phase 7 — weather-based outfit ideas: your city (Open-Meteo, free, no key)
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists city      text check (char_length(city) <= 80),
  add column if not exists latitude  numeric(8, 5) check (latitude between -90 and 90),
  add column if not exists longitude numeric(8, 5) check (longitude between -180 and 180);
