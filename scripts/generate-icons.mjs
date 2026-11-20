// Makes the PNG app icons (for installing Dolab on a phone) from the logo.
// Run again if you change the logo:   node scripts/generate-icons.mjs
import sharp from "sharp";

const BG = "#d6a46c"; // logo background (accent colour)
const INK = "#1b1209";
// The wardrobe drawing from app/icon.svg (on a 64 × 64 grid).
const drawing = `<g fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="17" y="11" width="30" height="37" rx="3.5"/><path d="M32 11v37"/><path d="M28 26v6M36 26v6"/><path d="M21 48v5M43 48v5"/></g>`;

// "any": rounded square, like the browser-tab icon.
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${BG}"/>${drawing}</svg>`;
// "maskable" / Apple: full square (the phone cuts its own shape); drawing kept
// inside the central safe zone so no shape crops it.
const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${BG}"/><g transform="translate(6.4 6.4) scale(0.8)">${drawing}</g></svg>`;

const outputs = [
  ["public/icons/icon-192.png", rounded, 192],
  ["public/icons/icon-512.png", rounded, 512],
  ["public/icons/maskable-512.png", fullBleed, 512],
  ["public/icons/apple-touch-icon.png", fullBleed, 180],
];
for (const [file, svg, size] of outputs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
