import type { SupabaseClient } from "@supabase/supabase-js";
import { storageConfig } from "@/config/dolab.config";
import type { Item, ItemWithPhotos } from "@/types/database";

// The photo bucket is private, so photos can't be shown with a plain URL.
// Instead we ask Supabase for short-lived "signed" links — all in one request.
//
// Speed: a new signed link is a NEW web address, so the browser would download
// every photo again on every page. We therefore reuse a link while it still has
// plenty of time left, and the browser can serve the photo from its cache.
// (Only paths that came from rows this user may read are ever looked up.)
const REUSE_UNTIL_MS = 15 * 60 * 1000; // get a fresh link when < 15 min remain
const MAX_CACHED = 5000;
const signedCache = new Map<string, { url: string; expiresAt: number }>();

export async function signPhotoPaths(supabase: SupabaseClient, paths: string[]): Promise<Map<string, string>> {
  const now = Date.now();
  const urlByPath = new Map<string, string>();
  const missing: string[] = [];
  for (const path of new Set(paths)) {
    const hit = signedCache.get(path);
    if (hit && hit.expiresAt - now > REUSE_UNTIL_MS) urlByPath.set(path, hit.url);
    else missing.push(path);
  }
  if (missing.length > 0) {
    const { data } = await supabase.storage
      .from(storageConfig.itemPhotosBucket)
      .createSignedUrls(missing, storageConfig.signedUrlSeconds);
    if (signedCache.size > MAX_CACHED) signedCache.clear(); // keep memory bounded
    const expiresAt = now + storageConfig.signedUrlSeconds * 1000;
    data?.forEach((entry) => {
      if (!entry.path || !entry.signedUrl) return;
      urlByPath.set(entry.path, entry.signedUrl);
      signedCache.set(entry.path, { url: entry.signedUrl, expiresAt });
    });
  }
  return urlByPath;
}

export async function attachPhotoUrls(supabase: SupabaseClient, items: Item[]): Promise<ItemWithPhotos[]> {
  const paths = items.flatMap((item) => [item.photo_path, item.cutout_path]).filter((p): p is string => !!p);
  const urlByPath = paths.length > 0 ? await signPhotoPaths(supabase, paths) : new Map<string, string>();

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
