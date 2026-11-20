"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/features/outfits/validation";

export type WearResult = { status: "ok" } | { status: "error" };

/**
 * The browser sends ITS date ("2026-11-15"), so "today" means today where you
 * are, not on the server's clock. We only accept dates within a day of the
 * server's, so nobody can log wears far in the past or future.
 */
function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const diff = Math.abs(Date.parse(`${day}T12:00:00Z`) - Date.now());
  return Number.isFinite(diff) && diff < 36 * 60 * 60 * 1000;
}

/** "Wore it today": one row per item for today (pressing twice changes nothing). */
export async function wearToday(itemIds: string[], day: string, outfitId?: string | null): Promise<WearResult> {
  await requireUserId();
  const ids = [...new Set(itemIds)].filter(isUuid).slice(0, 10);
  if (ids.length === 0 || !validDay(day)) return { status: "error" };
  const outfit_id = outfitId && isUuid(outfitId) ? outfitId : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("wear_logs")
    .upsert(ids.map((item_id) => ({ item_id, worn_on: day, outfit_id })), {
      onConflict: "user_id,item_id,worn_on",
      ignoreDuplicates: true,
    });
  if (error) return { status: "error" };
  revalidatePath("/stats");
  return { status: "ok" };
}

/** Undo today's "Wore it today" for these items. */
export async function undoWearToday(itemIds: string[], day: string): Promise<WearResult> {
  await requireUserId();
  const ids = itemIds.filter(isUuid);
  if (ids.length === 0 || !validDay(day)) return { status: "error" };
  const supabase = await createClient();
  const { error } = await supabase.from("wear_logs").delete().in("item_id", ids).eq("worn_on", day);
  if (error) return { status: "error" };
  revalidatePath("/stats");
  return { status: "ok" };
}
