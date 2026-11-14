// Colour maths for shading clothes and skin.

function toRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.replace(/./g, (c) => c + c) : value;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Blend two colours: amount 0 = a, 1 = b. */
export function mix(a: string, b: string, amount: number): string {
  const [ra, ga, ba] = toRgb(a);
  const [rb, gb, bb] = toRgb(b);
  return toHex([ra + (rb - ra) * amount, ga + (gb - ga) * amount, ba + (bb - ba) * amount]);
}

/** amount > 0 lightens, < 0 darkens (−1 … 1). */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? mix(hex, "#ffffff", amount) : mix(hex, "#000000", -amount);
}

/** 0 (black) … 1 (white), as the eye perceives it. */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** A colour for seams and stitching that stays visible on any fabric colour. */
export function detailInk(hex: string): string {
  return luminance(hex) < 0.08 ? shade(hex, 0.32) : shade(hex, -0.38);
}
