import { storageConfig } from "@/config/dolab.config";
import { createClient } from "@/lib/supabase/client";

const extensionByType: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

// Uploads straight from the browser to Supabase Storage (no trip through our
// server, so no file-size limits from Vercel). Files go in "<userId>/…" — the
// storage policies only allow that folder.
export async function uploadPhoto(image: Blob, userId: string): Promise<string> {
  const extension = extensionByType[image.type] ?? "webp";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await createClient()
    .storage.from(storageConfig.itemPhotosBucket)
    .upload(path, image, { contentType: image.type || "image/webp", upsert: false });

  if (error) throw error;
  return path;
}
