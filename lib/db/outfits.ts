import type { Outfit } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";
import { compareCodes } from "@/features/outfits/code";

/** An outfit plus the ids of the items in it. */
export type OutfitWithItemIds = Outfit & { itemIds: string[] };

type Row = Outfit & { outfit_items: { item_id: string }[] | null };

// One request: each outfit with its linked item ids (Supabase follows the
// outfit_items foreign key for us). Items themselves come from listItems(),
// which also signs their photo links.
export async function listOutfits(): Promise<OutfitWithItemIds[]> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfits")
    .select("*, outfit_items(item_id)")
    .eq("user_id", userId);
  if (error) throw new Error(`Couldn't load outfits: ${error.message}`);

  return ((data ?? []) as Row[])
    .map(({ outfit_items, ...outfit }) => ({ ...outfit, itemIds: (outfit_items ?? []).map((r) => r.item_id) }))
    .sort((a, b) => compareCodes(a.code, b.code));
}

export async function getOutfit(id: string): Promise<OutfitWithItemIds | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("outfits").select("*, outfit_items(item_id)").eq("id", id).maybeSingle();
  if (error || !data) return null; // also covers a malformed id
  const { outfit_items, ...outfit } = data as Row;
  return { ...outfit, itemIds: (outfit_items ?? []).map((r) => r.item_id) };
}
