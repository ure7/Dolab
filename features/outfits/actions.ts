"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextNewCode, nextVariationCode } from "./code";
import { cleanText, isUuid, type OutfitErrorKey } from "./validation";

export type SaveMode = "new" | "variation" | "update";

export type SaveOutfitInput = {
  itemIds: string[];
  name?: string;
  notes?: string;
  mode: SaveMode;
  /** Outer layer worn open (true) or closed. */
  jacketOpen?: boolean;
  /** The outfit being edited (needed for "variation" and "update"). */
  outfitId?: string;
};

export type OutfitResult = { status: "ok"; id: string; code: string } | { status: "error"; errorKey: OutfitErrorKey };

const UNIQUE_VIOLATION = "23505";

// Note: saveOutfit does NOT call revalidatePath. That would make Next.js
// re-render the page you're on — in the fitting room this reset the outfit
// you were still editing. The Outfits page loads fresh data whenever it is
// opened (dynamic pages aren't cached in the browser), so nothing goes stale.
export async function saveOutfit(input: SaveOutfitInput): Promise<OutfitResult> {
  await requireUserId();
  const supabase = await createClient();

  // ---- check the input (it comes from the browser, so don't trust it) ----
  const itemIds = [...new Set(input.itemIds)].filter(isUuid);
  if (itemIds.length === 0 || itemIds.length > 6) return { status: "error", errorKey: "noItems" };
  const jacket_open = input.jacketOpen !== false;
  const name = cleanText(input.name, 80);
  const notes = cleanText(input.notes, 500);
  if (name === undefined || notes === undefined) return { status: "error", errorKey: "tooLong" };

  // The items must exist (RLS: only your own come back) with one per category.
  const { data: items } = await supabase.from("items").select("id, category").in("id", itemIds);
  if (!items || items.length !== itemIds.length) return { status: "error", errorKey: "itemsMissing" };
  if (new Set(items.map((i) => i.category)).size !== items.length) return { status: "error", errorKey: "oneEach" };

  // ---- update an existing outfit ----
  if (input.mode === "update") {
    if (!input.outfitId || !isUuid(input.outfitId)) return { status: "error", errorKey: "saveFailed" };
    const { data: outfit, error } = await supabase
      .from("outfits")
      .update({ name, notes, jacket_open })
      .eq("id", input.outfitId)
      .select("id, code")
      .maybeSingle();
    if (error || !outfit) return { status: "error", errorKey: "saveFailed" };
    // Replace its items: remove the old links, add the new ones.
    const removed = await supabase.from("outfit_items").delete().eq("outfit_id", outfit.id);
    const added = await supabase.from("outfit_items").insert(itemIds.map((item_id) => ({ outfit_id: outfit.id, item_id })));
    if (removed.error || added.error) return { status: "error", errorKey: "saveFailed" };
    return { status: "ok", id: outfit.id, code: outfit.code };
  }

  // ---- create a new outfit (or a new version of one) ----
  let baseCode: string | null = null;
  if (input.mode === "variation") {
    if (!input.outfitId || !isUuid(input.outfitId)) return { status: "error", errorKey: "saveFailed" };
    const { data: base } = await supabase.from("outfits").select("code").eq("id", input.outfitId).maybeSingle();
    if (!base) return { status: "error", errorKey: "saveFailed" };
    baseCode = base.code;
  }

  // Two tabs saving at the same moment could pick the same code; the
  // database refuses the second one, so we simply try again with a fresh number.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: codes } = await supabase.from("outfits").select("code");
    const existing = (codes ?? []).map((c) => c.code);
    const code = baseCode ? nextVariationCode(existing, baseCode) : nextNewCode(existing);

    const { data: outfit, error } = await supabase.from("outfits").insert({ code, name, notes, jacket_open }).select("id, code").single();
    if (error?.code === UNIQUE_VIOLATION) continue;
    if (error || !outfit) return { status: "error", errorKey: "saveFailed" };

    const linked = await supabase.from("outfit_items").insert(itemIds.map((item_id) => ({ outfit_id: outfit.id, item_id })));
    if (linked.error) {
      await supabase.from("outfits").delete().eq("id", outfit.id); // don't leave an empty outfit behind
      return { status: "error", errorKey: "saveFailed" };
    }
    return { status: "ok", id: outfit.id, code: outfit.code };
  }
  return { status: "error", errorKey: "saveFailed" };
}

export async function renameOutfit(id: string, rawName: string): Promise<OutfitResult> {
  await requireUserId();
  const name = cleanText(rawName, 80);
  if (name === undefined) return { status: "error", errorKey: "tooLong" };
  if (!isUuid(id)) return { status: "error", errorKey: "saveFailed" };

  const supabase = await createClient();
  const { data, error } = await supabase.from("outfits").update({ name }).eq("id", id).select("id, code").maybeSingle();
  if (error || !data) return { status: "error", errorKey: "saveFailed" };
  revalidatePath("/outfits");
  return { status: "ok", id: data.id, code: data.code };
}

export async function deleteOutfit(id: string): Promise<OutfitResult | undefined> {
  await requireUserId();
  if (!isUuid(id)) return { status: "error", errorKey: "deleteFailed" };
  const supabase = await createClient();
  // outfit_items rows go too ("on delete cascade" in the schema). The clothes stay.
  const { error } = await supabase.from("outfits").delete().eq("id", id);
  if (error) return { status: "error", errorKey: "deleteFailed" };
  revalidatePath("/outfits");
}

// ---------------------------------------------------------------------------
// Share links: an outfit is public (read-only) while it has a share_token.
// ---------------------------------------------------------------------------

export type ShareResult = { status: "ok"; token: string | null } | { status: "error" };

/** Creates (or returns the existing) secret link code for an outfit. */
export async function shareOutfit(id: string): Promise<ShareResult> {
  await requireUserId();
  if (!isUuid(id)) return { status: "error" };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("outfits").select("share_token").eq("id", id).maybeSingle();
  if (!existing) return { status: "error" };
  if (existing.share_token) return { status: "ok", token: existing.share_token };

  // 18 random bytes → 24 URL-safe characters: impossible to guess.
  const token = randomBytes(18).toString("base64url");
  const { error } = await supabase.from("outfits").update({ share_token: token }).eq("id", id);
  if (error) return { status: "error" };
  revalidatePath("/outfits");
  return { status: "ok", token };
}

/** Removes the link: anyone who has it now sees "not shared anymore". */
export async function stopSharing(id: string): Promise<ShareResult> {
  await requireUserId();
  if (!isUuid(id)) return { status: "error" };
  const supabase = await createClient();
  const { error } = await supabase.from("outfits").update({ share_token: null }).eq("id", id);
  if (error) return { status: "error" };
  revalidatePath("/outfits");
  return { status: "ok", token: null };
}
