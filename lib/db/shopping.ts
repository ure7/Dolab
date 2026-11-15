import type { ShoppingItem } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";

// The shopping list, open entries first (newest first), bought ones last.
export async function listShopping(): Promise<ShoppingItem[]> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("user_id", userId)
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load the shopping list: ${error.message}`);
  return (data ?? []) as ShoppingItem[];
}
