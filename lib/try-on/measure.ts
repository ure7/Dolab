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

type Pixels = { data: Uint8ClampedArray; sw: number; sh: number; scale: number; w: number; h: number };

async function sample(url: string): Promise<Pixels | null> {
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
  return { data: ctx.getImageData(0, 0, sw, sh).data, sw, sh, scale, w, h };
}

/** The box around every pixel where `isGarment(offset)` is true, in full-size pixels. */
function boundingBox({ sw, sh, scale, w, h }: Pixels, isGarment: (offset: number) => boolean): PhotoCrop | null {
  let minX = sw, minY = sh, maxX = -1, maxY = -1;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (isGarment((y * sw + x) * 4)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null; // nothing to show

  // Back to full-size pixels, with a 1-sample margin so edges aren't clipped.
  const x0 = Math.max(0, (minX - 1) / scale);
  const y0 = Math.max(0, (minY - 1) / scale);
  const x1 = Math.min(w, (maxX + 2) / scale);
  const y1 = Math.min(h, (maxY + 2) / scale);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0, naturalWidth: w, naturalHeight: h };
}

async function scan(url: string): Promise<PhotoCrop | null> {
  const pixels = await sample(url);
  if (!pixels) return null;
  return boundingBox(pixels, (i) => pixels.data[i + 3] > SOLID);
}

// ---------------------------------------------------------------------------
// Photos that still have their background (no cut-out). If the background is
// plain (the four corners are all about the same colour), we find the garment
// as "everything clearly different from that colour" — so a pair of jeans
// photographed on a big white sheet still shows at its real size on the board.
// ---------------------------------------------------------------------------
export type PhotoMeasure = { crop: PhotoCrop; lightBackground: boolean };

const photoCache = new Map<string, Promise<PhotoMeasure | null>>();
const CORNER_MATCH = 40; // max colour distance between corners for a "plain" background
const GARMENT_DIFF = 48; // colour distance from the background that counts as garment

export function measurePhoto(url: string): Promise<PhotoMeasure | null> {
  const key = url.split("?")[0];
  let result = photoCache.get(key);
  if (!result) {
    result = scanPhoto(url).catch(() => null);
    photoCache.set(key, result);
  }
  return result;
}

const distance = (d: Uint8ClampedArray, i: number, c: number[]) =>
  Math.abs(d[i] - c[0]) + Math.abs(d[i + 1] - c[1]) + Math.abs(d[i + 2] - c[2]);

async function scanPhoto(url: string): Promise<PhotoMeasure | null> {
  const pixels = await sample(url);
  if (!pixels) return null;
  const { data, sw, sh } = pixels;
  const at = (x: number, y: number) => (y * sw + x) * 4;
  const corners = [at(1, 1), at(sw - 2, 1), at(1, sh - 2), at(sw - 2, sh - 2)];
  const bg = [0, 1, 2].map((c) => corners.reduce((sum, i) => sum + data[i + c], 0) / corners.length);
  if (corners.some((i) => distance(data, i, bg) > CORNER_MATCH)) return null; // busy background
  const crop = boundingBox(pixels, (i) => distance(data, i, bg) > GARMENT_DIFF);
  // Ignore results that are basically the whole photo (nothing gained) or a speck.
  if (!crop || crop.width * crop.height > 0.95 * pixels.w * pixels.h || crop.width * crop.height < 0.02 * pixels.w * pixels.h) return null;
  const luminance = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2];
  return { crop, lightBackground: luminance > 200 };
}
