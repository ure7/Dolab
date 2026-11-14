-- =============================================================================
-- Dolab — initial schema
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Security model: every table has Row Level Security (RLS) enabled, and every
-- policy checks `user_id = auth.uid()`. That means the database itself refuses
-- to return or change another user's rows, even if the app code had a bug.
--
-- Category and colour values are plain text (not CHECK constraints) on purpose:
-- the list lives in config/dolab.config.ts so you can add options without a
-- database migration.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Helper: keep updated_at fresh automatically
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- profiles — one row per user. Supabase keeps logins in auth.users (which we
-- can't add columns to), so app-specific user data lives here.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text check (char_length(display_name) <= 60),
  shopping_budget numeric(10, 2) check (shopping_budget >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when someone signs up.
-- security definer: runs with the function owner's rights, because the new
-- user isn't "logged in" yet at the moment this trigger fires.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- items — the wardrobe
-- -----------------------------------------------------------------------------
create table public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  brand       text check (char_length(brand) <= 60),
  colour      text not null,          -- id from clothingColours in the config
  category    text not null,          -- id from categories in the config
  condition   text not null default 'good' check (condition in ('good', 'worn_out')),
  notes       text check (char_length(notes) <= 500),
  photo_path  text,                   -- original photo, path inside the storage bucket
  cutout_path text,                   -- background-removed PNG (optional)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index items_user_id_idx on public.items (user_id);

create trigger items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- outfits — a saved combination, numbered like 1.1, 1.2, 2.1 …
-- -----------------------------------------------------------------------------
create table public.outfits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code       text not null check (code ~ '^[0-9]+\.[0-9]+$'),  -- e.g. "1.2"
  name       text check (char_length(name) <= 80),
  notes      text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

create index outfits_user_id_idx on public.outfits (user_id);

create trigger outfits_updated_at
  before update on public.outfits
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- outfit_items — which items are in which outfit (many-to-many).
-- user_id is stored here too so the RLS policy stays a simple, fast check.
-- -----------------------------------------------------------------------------
create table public.outfit_items (
  outfit_id  uuid not null references public.outfits (id) on delete cascade,
  item_id    uuid not null references public.items (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (outfit_id, item_id)
);

create index outfit_items_user_id_idx on public.outfit_items (user_id);
create index outfit_items_item_id_idx on public.outfit_items (item_id);


-- -----------------------------------------------------------------------------
-- shopping_items — the shopping list
-- -----------------------------------------------------------------------------
create table public.shopping_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  section        text not null default 'need' check (section in ('need', 'nice_to_have')),
  category       text,               -- optional, id from categories in the config
  price_estimate numeric(10, 2) check (price_estimate >= 0),
  is_done        boolean not null default false,
  notes          text check (char_length(notes) <= 500),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index shopping_items_user_id_idx on public.shopping_items (user_id);

create trigger shopping_items_updated_at
  before update on public.shopping_items
  for each row execute function public.set_updated_at();


-- =============================================================================
-- Row Level Security
-- (select auth.uid()) is wrapped in a sub-select so Postgres evaluates it once
-- per query instead of once per row — Supabase's recommended pattern.
-- =============================================================================
alter table public.profiles       enable row level security;
alter table public.items          enable row level security;
alter table public.outfits        enable row level security;
alter table public.outfit_items   enable row level security;
alter table public.shopping_items enable row level security;

-- profiles: you can read and update only your own profile (rows are created by the trigger)
create policy "Own profile: read"   on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Own profile: update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- items
create policy "Own items: all" on public.items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- outfits
create policy "Own outfits: all" on public.outfits for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- outfit_items: also check that the outfit AND the item both belong to you,
-- so nobody can link their outfit to someone else's item by guessing an id.
create policy "Own outfit items: all" on public.outfit_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid()))
    and exists (select 1 from public.items   i where i.id = item_id   and i.user_id = (select auth.uid()))
  );

-- shopping_items
create policy "Own shopping items: all" on public.shopping_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Explicit grants: newer Supabase projects don't expose new tables to the API
-- automatically. RLS above still decides *which rows* a user can touch.
grant select, update                 on public.profiles       to authenticated;
grant select, insert, update, delete on public.items          to authenticated;
grant select, insert, update, delete on public.outfits        to authenticated;
grant select, insert, update, delete on public.outfit_items   to authenticated;
grant select, insert, update, delete on public.shopping_items to authenticated;


-- =============================================================================
-- Storage: private bucket for item photos.
-- Files are stored as  <user_id>/<file name>, and policies only allow access
-- when the first folder in the path equals your own user id.
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Own photos: read" on storage.objects for select to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Own photos: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Own photos: update" on storage.objects for update to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Own photos: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
