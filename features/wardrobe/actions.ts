"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { removePhotos } from "@/lib/db/photos";
import { parseItemForm, type ItemErrorKey } from "./validation";

export type ItemActionResult = { status: "error"; errorKey: ItemErrorKey };

// Creates a new item, or updates one when the form includes an id.
export async function saveItem(formData: FormData): Promise<ItemActionResult> {
  const userId = await requireUserId();
  const parsed = parseItemForm(formData, userId);
  if (!parsed.ok) return { status: "error", errorKey: parsed.errorKey };

  const supabase = await createClient();
  const id = formData.get("id");

  if (typeof id === "string" && id) {
    const { data: previous } = await supabase.from("items").select("photo_path, cutout_path").eq("id", id).single();
    const { error } = await supabase.from("items").update(parsed.data).eq("id", id);
    if (error) return { status: "error", errorKey: "saveFailed" };

    // Clean up photos that were replaced or removed, so storage doesn't fill up.
    const stillUsed = [parsed.data.photo_path, parsed.data.cutout_path];
    await removePhotos(
      supabase,
      [previous?.photo_path, previous?.cutout_path].filter((p) => p && !stillUsed.includes(p)),
    );
  } else {
    const { error } = await supabase.from("items").insert(parsed.data);
    if (error) return { status: "error", errorKey: "saveFailed" };
  }

  revalidatePath("/wardrobe");
  redirect("/wardrobe");
}

export async function deleteItem(id: string): Promise<ItemActionResult> {
  await requireUserId();
  const supabase = await createClient();

  // .select() returns the deleted row, so we know which photos to remove.
  const { data, error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .select("photo_path, cutout_path")
    .maybeSingle();
  if (error) return { status: "error", errorKey: "deleteFailed" };

  await removePhotos(supabase, [data?.photo_path, data?.cutout_path]);
  revalidatePath("/wardrobe");
  redirect("/wardrobe");
}

// "Try before you buy" → it's now in the real wardrobe.
export async function markAsBought(id: string): Promise<ItemActionResult> {
  await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("items")
    .update({ status: "owned", bought_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "not_owned");
  if (error) return { status: "error", errorKey: "saveFailed" };

  // If it was on the shopping list, tick it off there too.
  await supabase.from("shopping_items").update({ is_done: true }).eq("item_id", id);

  revalidatePath("/wardrobe");
  revalidatePath("/shopping");
  revalidatePath(`/wardrobe/${id}`);
  return redirect(`/wardrobe/${id}`);
}
