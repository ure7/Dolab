import type { PhotoCrop } from "./types";

// Background-removed photos keep the full original canvas, with a lot of
// transparent space around the garment. To place a T-shirt on the shoulders
// we need the box around its VISIBLE pixels, so we scan the alpha channel.

const SAMPLE = 200; // scan a small copy — plenty accurate, and fast
const SOLID = 24; // alpha (0–255) above which a pixel counts as "garment"

// Signed links change on every page load, but the file path doesn't,
// so the path (the part before "?") is the cache key.
const cache = new Map<string, Promise<PhotoCrop | null>>();

export function measureCutout(url: string): Promise<PhotoCrop | null> {
  const key = url.split("?")[0];
  let result = cache.get(key);
  if (!result) {
    result = scan(url).catch(() => null);
    cache.set(key, result);
  }
  return result;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // needed to read pixels from another domain (Supabase)
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function scan(url: string): Promise<PhotoCrop | null> {
  const img = await loadImage(url);
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, SAMPLE / Math.max(w, h));
  const sw = Math.max(1, Math.round(w * scale));
  const sh = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, sw, sh);
  const { data } = ctx.getImageData(0, 0, sw, sh);

  let minX = sw, minY = sh, maxX = -1, maxY = -1;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (data[(y * sw + x) * 4 + 3] > SOLID) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null; // fully transparent — nothing to show

  // Back to full-size pixels, with a 1-sample margin so edges aren't clipped.
  const x0 = Math.max(0, (minX - 1) / scale);
  const y0 = Math.max(0, (minY - 1) / scale);
  const x1 = Math.min(w, (maxX + 2) / scale);
  const y1 = Math.min(h, (maxY + 2) / scale);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0, naturalWidth: w, naturalHeight: h };
}
