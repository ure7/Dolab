import type { Dictionary } from "@/lib/i18n";
import type { Item } from "@/types/database";
import { isCategoryId, isColourId, isCondition, isItemStatus } from "@/lib/helpers/config-guards";

export type ItemErrorKey = keyof Dictionary["wardrobe"]["errors"];

// The columns a user is allowed to set from the item form.
export type ItemInput = Pick<
  Item,
  | "name"
  | "brand"
  | "colour"
  | "category"
  | "condition"
  | "notes"
  | "photo_path"
  | "cutout_path"
  | "status"
  | "store_name"
  | "price"
  | "product_url"
>;

type ParseResult = { ok: true; data: ItemInput } | { ok: false; errorKey: ItemErrorKey };

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

// Empty → null, too long → error (undefined).
function optionalText(formData: FormData, field: string, maxLength: number): string | null | undefined {
  const value = text(formData, field);
  if (!value) return null;
  return value.length <= maxLength ? value : undefined;
}

// A photo path must sit inside the user's own folder ("<userId>/..."), so
// nobody can attach someone else's file to their item by editing the form.
function ownPhotoPath(formData: FormData, field: string, userId: string): string | null | undefined {
  const value = text(formData, field);
  if (!value) return null;
  return value.startsWith(`${userId}/`) && !value.includes("..") ? value : undefined;
}

function parsePrice(raw: string): number | null | undefined {
  if (!raw) return null;
  const price = Number(raw.replace(",", "."));
  return Number.isFinite(price) && price >= 0 && price < 1_000_000 ? Math.round(price * 100) / 100 : undefined;
}

// Never trust the browser: this re-checks every field on the server, even
// though the form already has HTML validation.
export function parseItemForm(formData: FormData, userId: string): ParseResult {
  const name = text(formData, "name");
  if (!name || name.length > 80) return { ok: false, errorKey: "nameRequired" };

  const category = text(formData, "category");
  if (!isCategoryId(category)) return { ok: false, errorKey: "categoryRequired" };

  const colour = text(formData, "colour");
  if (!isColourId(colour)) return { ok: false, errorKey: "colourRequired" };

  const condition = text(formData, "condition") || "good";
  const status = text(formData, "status") || "owned";
  if (!isCondition(condition) || !isItemStatus(status)) return { ok: false, errorKey: "invalidField" };

  const productUrl = optionalText(formData, "product_url", 500);
  if (productUrl && !/^https?:\/\//i.test(productUrl)) return { ok: false, errorKey: "invalidUrl" };

  const price = parsePrice(text(formData, "price"));
  if (price === undefined) return { ok: false, errorKey: "invalidPrice" };

  const brand = optionalText(formData, "brand", 60);
  const notes = optionalText(formData, "notes", 500);
  const storeName = optionalText(formData, "store_name", 60);
  const photoPath = ownPhotoPath(formData, "photo_path", userId);
  const cutoutPath = ownPhotoPath(formData, "cutout_path", userId);

  const anyInvalid = [brand, notes, storeName, productUrl, photoPath, cutoutPath].includes(undefined);
  if (anyInvalid) return { ok: false, errorKey: "invalidField" };

  return {
    ok: true,
    data: {
      name,
      brand: brand ?? null,
      colour,
      category,
      condition,
      notes: notes ?? null,
      photo_path: photoPath ?? null,
      cutout_path: cutoutPath ?? null,
      status,
      store_name: storeName ?? null,
      price,
      product_url: productUrl ?? null,
    },
  };
}
