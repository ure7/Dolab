import type { CategoryId, ColourId, Condition, ItemStatus } from "@/config/dolab.config";
import type { Item, ItemWithPhotos } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";
import { attachPhotoUrls } from "./photos";

export type ItemFilters = {
  q?: string;
  category?: CategoryId;
  colour?: ColourId;
  condition?: Condition;
  status?: ItemStatus;
};

// Characters with special meaning in Supabase's filter syntax are stripped
// from the search text so a search like "shirt, (blue)" can't break the query.
function cleanSearch(q: string): string {
  return q.replace(/[%_,()*\\:."]/g, " ").trim();
}

export async function listItems(filters: ItemFilters = {}): Promise<ItemWithPhotos[]> {
  const userId = await requireUserId();
  const supabase = await createClient();

  // RLS already limits rows to this user; filtering by user_id too lets
  // Postgres use the index, which keeps the query fast as the wardrobe grows.
  let query = supabase.from("items").select("*").eq("user_id", userId).order("created_at", { ascending: false });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.colour) query = query.eq("colour", filters.colour);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.status) query = query.eq("status", filters.status);

  const search = filters.q ? cleanSearch(filters.q) : "";
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(`name.ilike.${pattern},brand.ilike.${pattern},notes.ilike.${pattern},store_name.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Couldn't load items: ${error.message}`);
  return attachPhotoUrls(supabase, (data ?? []) as Item[]);
}

export async function getItem(id: string): Promise<ItemWithPhotos | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("items").select("*").eq("id", id).maybeSingle();

  // A malformed id (not a UUID) also lands here — treat it as "not found".
  if (error || !data) return null;
  const [item] = await attachPhotoUrls(supabase, [data as Item]);
  return item;
}
