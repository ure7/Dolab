// Cleans up the AI's cut-out mask so garments come out SOLID.
//
// The background-removal model is unsure about dark fabric (black, navy):
// it marks parts of a black T-shirt as half-transparent or as background,
// which leaves holes — or keeps only a T-shirt's PRINT and drops the black
// shirt itself. Clothes are solid objects, so we can fix that:
//   0. colour check — if the photo has a plain background (a sheet, a floor),
//                     anything clearly different from that colour is fabric too
//   1. threshold   — anything the model is fairly sure about counts as fabric
//   2. close gaps  — "grow then shrink" the shape to seal small cracks and bites
//   3. drop specks — remove tiny islands of leftover background
//   4. fill holes  — any gap fully surrounded by fabric becomes fabric
//   5. soft edge   — a 1-pixel blur so the outline isn't jagged
// All of this runs in the browser on the mask (one number per pixel).

export const refineSettings = {
  /** 0–255: model confidence above which a pixel counts as fabric. Lower = keeps more of dark clothes. */
  threshold: 70,
  /** Gap-closing radius, as a share of the image's longest side. */
  closeRadius: 0.008,
  /** Islands smaller than this share of the main garment are removed. */
  minIslandShare: 0.02,
  /** Enclosed gaps bigger than this share of the garment stay open (e.g. a bag handle loop). */
  maxHoleShare: 0.2,
  /** Colour check: share of the photo's border that must match one colour to count as a "plain background". */
  plainBorderShare: 0.6,
  /** Colour check: minimum colour distance (0–441) from the background to count as fabric. */
  minColourDistance: 45,
};

/**
 * Takes the model's alpha mask (0–255 per pixel) plus the photo's own pixels
 * (RGBA) and returns a cleaned mask.
 */
export function refineMask(alpha: Uint8ClampedArray, rgba: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const n = width * height;
  let solid: Uint8Array = new Uint8Array(n);
  for (let i = 0; i < n; i++) solid[i] = alpha[i] > refineSettings.threshold ? 1 : 0;

  const byColour = colourMask(rgba, width, height);
  if (byColour) for (let i = 0; i < n; i++) solid[i] |= byColour[i];

  const radius = Math.max(2, Math.round(Math.max(width, height) * refineSettings.closeRadius));
  solid = erode(dilate(solid, width, height, radius), width, height, radius);
  solid = dropSmallIslands(solid, width, height);
  fillHoles(solid, width, height);
  // Pull the edge in by 1px: the outermost pixels are often a halo of the old background.
  solid = erode(solid, width, height, 1);

  // Final alpha: solid = fully opaque, then soften the edge a little.
  const out = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i++) out[i] = solid[i] ? 255 : 0;
  return boxBlur(out, width, height, 1);
}

// ---- colour check ----

/**
 * If the photo's border is mostly one colour (a plain background), returns a
 * mask of every pixel that clearly differs from it. Otherwise null — busy
 * backgrounds (wood floors, shops) are left to the AI alone.
 */
function colourMask(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array | null {
  const border: number[] = [];
  for (let x = 0; x < width; x++) border.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y++) border.push(y * width, y * width + width - 1);

  // Background colour = median of the border pixels (robust to a garment touching the edge).
  const median = [0, 1, 2].map((c) => {
    const values = border.map((p) => rgba[p * 4 + c]).sort((a, b) => a - b);
    return values[values.length >> 1];
  });
  const distance = (p: number) =>
    Math.hypot(rgba[p * 4] - median[0], rgba[p * 4 + 1] - median[1], rgba[p * 4 + 2] - median[2]);

  const close = border.map(distance).filter((d) => d < 40);
  if (close.length < border.length * refineSettings.plainBorderShare) return null;
  const noise = close.reduce((a, b) => a + b, 0) / close.length; // how much the background itself varies
  const limit = Math.max(refineSettings.minColourDistance, noise * 3 + 12);

  const mask = new Uint8Array(width * height);
  for (let p = 0; p < mask.length; p++) mask[p] = distance(p) > limit ? 1 : 0;
  return mask;
}

// ---- grow / shrink a shape (square brush), done row-wise then column-wise ----

function slidingCount(src: Uint8Array, width: number, height: number, r: number, horizontal: boolean): Uint16Array {
  const out = new Uint16Array(src.length);
  const lines = horizontal ? height : width;
  const len = horizontal ? width : height;
  const idx = horizontal ? (line: number, k: number) => line * width + k : (line: number, k: number) => k * width + line;
  for (let line = 0; line < lines; line++) {
    let sum = 0;
    for (let k = 0; k <= r && k < len; k++) sum += src[idx(line, k)];
    for (let k = 0; k < len; k++) {
      out[idx(line, k)] = sum;
      const add = k + r + 1;
      const remove = k - r;
      if (add < len) sum += src[idx(line, add)];
      if (remove >= 0) sum -= src[idx(line, remove)];
    }
  }
  return out;
}

function dilate(src: Uint8Array, width: number, height: number, r: number): Uint8Array {
  const pass = (a: Uint8Array, horizontal: boolean) => {
    const counts = slidingCount(a, width, height, r, horizontal);
    return Uint8Array.from(counts, (c) => (c > 0 ? 1 : 0));
  };
  return pass(pass(src, true), false);
}

function erode(src: Uint8Array, width: number, height: number, r: number): Uint8Array {
  // Eroding the shape = dilating the background.
  const inverted = Uint8Array.from(src, (v) => 1 - v);
  return Uint8Array.from(dilate(inverted, width, height, r), (v) => 1 - v);
}

// ---- connected areas ----

/** Labels 4-connected areas where mask === value; returns labels + their sizes. */
function label(mask: Uint8Array, width: number, height: number, value: 0 | 1) {
  const labels = new Int32Array(mask.length).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (mask[start] !== value || labels[start] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    labels[start] = id;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop()!;
      size++;
      const x = p % width;
      const neighbours = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p - width, p + width];
      for (const q of neighbours) {
        if (q >= 0 && q < mask.length && mask[q] === value && labels[q] === -1) {
          labels[q] = id;
          stack.push(q);
        }
      }
    }
    sizes.push(size);
  }
  return { labels, sizes };
}

function dropSmallIslands(solid: Uint8Array, width: number, height: number): Uint8Array {
  const { labels, sizes } = label(solid, width, height, 1);
  if (sizes.length <= 1) return solid;
  const biggest = Math.max(...sizes);
  const keep = sizes.map((s) => s >= biggest * refineSettings.minIslandShare);
  return Uint8Array.from(solid, (v, i) => (v && keep[labels[i]] ? 1 : 0));
}

/** Background that can't reach the image border is a hole inside the garment → fill it. */
function fillHoles(solid: Uint8Array, width: number, height: number) {
  let garment = 0;
  for (const v of solid) garment += v;
  const { labels, sizes } = label(solid, width, height, 0);
  const touchesBorder = new Array<boolean>(sizes.length).fill(false);
  for (let x = 0; x < width; x++) {
    for (const p of [x, (height - 1) * width + x]) if (labels[p] >= 0) touchesBorder[labels[p]] = true;
  }
  for (let y = 0; y < height; y++) {
    for (const p of [y * width, y * width + width - 1]) if (labels[p] >= 0) touchesBorder[labels[p]] = true;
  }
  const fill = sizes.map((size, id) => !touchesBorder[id] && size <= garment * refineSettings.maxHoleShare);
  for (let i = 0; i < solid.length; i++) if (!solid[i] && fill[labels[i]]) solid[i] = 1;
}

function boxBlur(src: Uint8ClampedArray, width: number, height: number, r: number): Uint8ClampedArray {
  const tmp = new Uint8ClampedArray(src.length);
  const out = new Uint8ClampedArray(src.length);
  const size = 2 * r + 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += src[y * width + Math.min(width - 1, Math.max(0, x + k))];
      tmp[y * width + x] = sum / size;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += tmp[Math.min(height - 1, Math.max(0, y + k)) * width + x];
      out[y * width + x] = sum / size;
    }
  }
  return out;
}
