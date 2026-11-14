-- =============================================================================
-- Dolab — phase 3: body profile for the fitting-room mannequin
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- All columns are optional: until they're filled in, the app uses defaults.
-- =============================================================================

alter table public.profiles
  add column gender     text check (gender in ('female', 'male')),
  add column height_cm  smallint check (height_cm between 120 and 220),
  add column weight_kg  numeric(5, 1) check (weight_kg between 30 and 200),
  add column body_shape text check (body_shape in ('slim', 'average', 'athletic', 'broad')),
  add column skin_tone  text check (char_length(skin_tone) <= 20);  -- id from skinTones in the config
