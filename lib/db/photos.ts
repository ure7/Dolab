import type { SupabaseClient } from "@supabase/supabase-js";
import { storageConfig } from "@/config/dolab.config";
import type { Item, ItemWithPhotos } from "@/types/database";

// The photo bucket is private, so photos can't be shown with a plain URL.
// Instead we ask Supabase for short-lived "signed" links — all in one request.
export async function attachPhotoUrls(supabase: SupabaseClient, items: Item[]): Promise<ItemWithPhotos[]> {
  const paths = items.flatMap((item) => [item.photo_path, item.cutout_path]).filter((p): p is string => !!p);

  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from(storageConfig.itemPhotosBucket)
      .createSignedUrls(paths, storageConfig.signedUrlSeconds);
    data?.forEach((entry) => {
      if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
    });
  }

  return items.map((item) => ({
    ...item,
    photoUrl: item.photo_path ? (urlByPath.get(item.photo_path) ?? null) : null,
    cutoutUrl: item.cutout_path ? (urlByPath.get(item.cutout_path) ?? null) : null,
  }));
}

// Deletes files from the bucket. Failures are ignored on purpose: a leftover
// file wastes a little storage but must never block deleting/saving an item.
export async function removePhotos(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
  const toRemove = paths.filter((p): p is string => !!p);
  if (toRemove.length === 0) return;
  await supabase.storage.from(storageConfig.itemPhotosBucket).remove(toRemove);
}
