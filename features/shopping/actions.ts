"use server";

import { revalidatePath } from "next/cache";
import { shoppingSections, type ShoppingSection } from "@/config/dolab.config";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isCategoryId } from "@/lib/helpers/config-guards";
import { cleanText, isUuid } from "@/features/outfits/validation";
import type { Dictionary } from "@/lib/i18n";

export type ShoppingErrorKey = keyof Dictionary["shopping"]["errors"];
export type ShoppingResult = { status: "ok" } | { status: "error"; errorKey: ShoppingErrorKey };

const ok: ShoppingResult = { status: "ok" };
const fail = (errorKey: ShoppingErrorKey): ShoppingResult => ({ status: "error", errorKey });

const isSection = (v: unknown): v is ShoppingSection => typeof v === "string" && (shoppingSections as readonly string[]).includes(v);

/** "12.50" → 12.5; empty → null; anything invalid → undefined. */
function money(value: FormDataEntryValue | null): number | null | undefined {
  const text = typeof value === "string" ? value.trim().replace(",", ".") : "";
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 && n < 100_000_000 ? Math.round(n * 100) / 100 : undefined;
}

function done() {
  revalidatePath("/shopping");
}

export async function addShoppingItem(formData: FormData): Promise<ShoppingResult> {
  await requireUserId();
  const name = cleanText(formData.get("name"), 80);
  const notes = cleanText(formData.get("notes"), 500);
  const price = money(formData.get("price_estimate"));
  const section = formData.get("section");
  const category = formData.get("category");
  if (!name) return fail("nameRequired");
  if (notes === undefined) return fail("tooLong");
  if (price === undefined) return fail("invalidPrice");

  const supabase = await createClient();
  const { error } = await supabase.from("shopping_items").insert({
    name,
    notes,
    price_estimate: price,
    section: isSection(section) ? section : "need",
    category: isCategoryId(category) ? category : null,
  });
  if (error) return fail("saveFailed");
  done();
  return ok;
}

/** Puts a "not owned yet" (or worn-out) wardrobe item on the list. */
export async function addFromItem(itemId: string, reason: "buy" | "replace"): Promise<ShoppingResult> {
  await requireUserId();
  if (!isUuid(itemId)) return fail("saveFailed");
  const supabase = await createClient();
  const { data: item } = await supabase.from("items").select("id, name, category, price, store_name, status").eq("id", itemId).maybeSingle();
  if (!item) return fail("saveFailed");

  const { error } = await supabase.from("shopping_items").insert({
    name: item.name,
    category: item.category,
    price_estimate: reason === "buy" ? item.price : null,
    notes: reason === "buy" ? item.store_name : null,
    section: "need",
    // Only "buy" entries are linked: ticking them off marks the item as bought.
    item_id: reason === "buy" ? item.id : null,
  });
  // 23505 = already on the list (one entry per item) — that's fine.
  if (error && error.code !== "23505") return fail("saveFailed");
  done();
  return ok;
}

/** Tick / untick. Ticking a linked "not owned yet" item also moves it into your wardrobe. */
export async function setDone(id: string, isDone: boolean): Promise<ShoppingResult> {
  await requireUserId();
  if (!isUuid(id)) return fail("saveFailed");
  const supabase = await createClient();
  const { data, error } = await supabase.from("shopping_items").update({ is_done: isDone }).eq("id", id).select("item_id").maybeSingle();
  if (error || !data) return fail("saveFailed");

  if (isDone && data.item_id) {
    await supabase
      .from("items")
      .update({ status: "owned", bought_at: new Date().toISOString() })
      .eq("id", data.item_id)
      .eq("status", "not_owned");
    revalidatePath("/wardrobe");
  }
  done();
  return ok;
}

export async function moveToSection(id: string, section: ShoppingSection): Promise<ShoppingResult> {
  await requireUserId();
  if (!isUuid(id) || !isSection(section)) return fail("saveFailed");
  const supabase = await createClient();
  const { error } = await supabase.from("shopping_items").update({ section }).eq("id", id);
  if (error) return fail("saveFailed");
  done();
  return ok;
}

export async function deleteShoppingItem(id: string): Promise<ShoppingResult> {
  await requireUserId();
  if (!isUuid(id)) return fail("deleteFailed");
  const supabase = await createClient();
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);
  if (error) return fail("deleteFailed");
  done();
  return ok;
}

export async function clearBought(): Promise<ShoppingResult> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("shopping_items").delete().eq("user_id", userId).eq("is_done", true);
  if (error) return fail("deleteFailed");
  done();
  return ok;
}

export async function setBudget(formData: FormData): Promise<ShoppingResult> {
  const userId = await requireUserId();
  const budget = money(formData.get("budget"));
  if (budget === undefined) return fail("invalidPrice");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ shopping_budget: budget }).eq("id", userId);
  if (error) return fail("saveFailed");
  done();
  return ok;
}
