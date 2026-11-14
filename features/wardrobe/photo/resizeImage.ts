import { storageConfig } from "@/config/dolab.config";

// Phone photos are often 4000px+ and several MB. Shrinking them in the browser
// before upload makes saving faster and keeps us inside the free storage tier.
// WebP keeps transparency (needed for background-removed cut-outs).
export async function resizeImage(image: Blob, maxDimension: number = storageConfig.maxPhotoDimension): Promise<Blob> {
  const bitmap = await createImageBitmap(image, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    // Browsers that can't write WebP (older Safari) quietly fall back to PNG — that's fine.
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/webp",
      storageConfig.photoQuality,
    );
  });
}
