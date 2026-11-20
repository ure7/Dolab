// TypeScript shapes of the database rows (see supabase/migrations/0001_init.sql).
// Kept by hand so they're easy to read; update both together if you add a column.

import type {
  BodyShape,
  CategoryId,
  ColourId,
  Condition,
  Gender,
  ItemStatus,
  ShoppingSection,
} from "@/config/dolab.config";

export type Profile = {
  id: string;
  display_name: string | null;
  shopping_budget: number | null;
  // Body profile (migration 0003) — null until the user fills it in
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_shape: BodyShape | null;
  skin_tone: string | null; // no longer used by the app (kept so old data is harmless)
  // migration 0004: place for weather-based outfit ideas
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export type Item = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  colour: ColourId;
  category: CategoryId;
  condition: Condition;
  notes: string | null;
  photo_path: string | null;
  cutout_path: string | null;
  // "Try before you buy" (migration 0002)
  status: ItemStatus;
  store_name: string | null;
  price: number | null;
  product_url: string | null;
  bought_at: string | null;
  created_at: string;
  updated_at: string;
};

// An item plus short-lived links to its private photos, ready to display.
export type ItemWithPhotos = Item & {
  photoUrl: string | null;
  cutoutUrl: string | null;
};

export type Outfit = {
  id: string;
  user_id: string;
  code: string; // e.g. "1.2"
  name: string | null;
  notes: string | null;
  // migration 0004
  jacket_open: boolean; // outer layer worn open (true) or closed
  share_token: string | null; // set = shared with a public read-only link
  created_at: string;
  updated_at: string;
};

export type OutfitItem = {
  outfit_id: string;
  item_id: string;
  user_id: string;
  created_at: string;
};

export type ShoppingItem = {
  id: string;
  user_id: string;
  name: string;
  section: ShoppingSection;
  category: CategoryId | null;
  price_estimate: number | null;
  is_done: boolean;
  notes: string | null;
  item_id: string | null; // migration 0004: linked "not owned yet" wardrobe item
  created_at: string;
  updated_at: string;
};
