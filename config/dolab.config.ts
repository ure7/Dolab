/**
 * Dolab settings — the one place to change colours, categories and app options.
 * Text labels (in English and Arabic) live in lib/i18n/dictionaries so they can be translated.
 */

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export const appConfig = {
  name: { en: "Dolab", ar: "دولاب" },
  // Used to format prices on the shopping list (ISO 4217 code).
  currency: "USD",
  // Where logged-in users land after login / sign up.
  homePath: "/wardrobe",
} as const;

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
// Languages written right-to-left; the whole layout mirrors for these.
export const rtlLocales: readonly Locale[] = ["ar"];
export const localeCookieName = "dolab-locale";

// ---------------------------------------------------------------------------
// Theme (UI colours). These become CSS variables, so Tailwind classes like
// bg-surface or text-accent pick them up automatically — see app/globals.css.
// ---------------------------------------------------------------------------
export const theme = {
  background: "#0b0d10",
  surface: "#14171c",
  surfaceRaised: "#1c2028",
  border: "#2a2f39",
  text: "#eceef1",
  muted: "#8f96a3",
  accent: "#d6a46c", // warm wood tone — a nod to a real wooden dolab
  accentText: "#1b1209",
  // Behind clothing photos: light and neutral, so black AND white clothes both stand out.
  photoBackground: "#f2f0ec",
  danger: "#f87171",
  success: "#4ade80",
} as const;

// ---------------------------------------------------------------------------
// Navigation (order = order in the header and the mobile tab bar)
// ---------------------------------------------------------------------------
export const navItems = [
  { href: "/wardrobe", labelKey: "wardrobe", icon: "hanger" },
  { href: "/fitting-room", labelKey: "fittingRoom", icon: "mannequin" },
  { href: "/outfits", labelKey: "outfits", icon: "grid" },
  { href: "/shopping", labelKey: "shopping", icon: "bag" },
] as const;

// ---------------------------------------------------------------------------
// Clothing categories.
// zone  = where the item goes on the mannequin.
// layer = drawing order inside a zone (higher = on top). One item per layer.
// ---------------------------------------------------------------------------
export const categories = [
  { id: "inner_top", zone: "torso", layer: 1 },
  { id: "hoodie", zone: "torso", layer: 2 },
  { id: "outer_layer", zone: "torso", layer: 3 },
  { id: "bottoms", zone: "legs", layer: 1 },
  { id: "shoes", zone: "feet", layer: 1 },
  { id: "accessory", zone: "accessory", layer: 1 },
] as const;
export type CategoryId = (typeof categories)[number]["id"];

// ---------------------------------------------------------------------------
// Clothing colours. `neutral` colours are treated as matching everything
// when suggesting outfit ideas.
// ---------------------------------------------------------------------------
export const clothingColours = [
  { id: "black", hex: "#1a1a1a", neutral: true },
  { id: "white", hex: "#f4f4f2", neutral: true },
  { id: "grey", hex: "#8a8d91", neutral: true },
  { id: "beige", hex: "#d9c7a7", neutral: true },
  { id: "navy", hex: "#1f2d4d", neutral: true },
  { id: "denim", hex: "#4a6a94", neutral: true },
  { id: "brown", hex: "#6b4a2f", neutral: false },
  { id: "olive", hex: "#6b6b3a", neutral: false },
  { id: "green", hex: "#2f7d4f", neutral: false },
  { id: "blue", hex: "#2f6fd6", neutral: false },
  { id: "light_blue", hex: "#9cc4ec", neutral: false },
  { id: "red", hex: "#c0392b", neutral: false },
  { id: "burgundy", hex: "#6d1f2c", neutral: false },
  { id: "pink", hex: "#e89bb5", neutral: false },
  { id: "purple", hex: "#6c4a9e", neutral: false },
  { id: "orange", hex: "#e07b2e", neutral: false },
  { id: "yellow", hex: "#e8c547", neutral: false },
] as const;
export type ColourId = (typeof clothingColours)[number]["id"];

// ---------------------------------------------------------------------------
// Item condition and shopping list sections
// ---------------------------------------------------------------------------
export const conditions = ["good", "worn_out"] as const;
export type Condition = (typeof conditions)[number];

export const shoppingSections = ["need", "nice_to_have"] as const;
export type ShoppingSection = (typeof shoppingSections)[number];

// "not_owned" = an item seen in a shop or online that you want to try on
// before buying ("try before you buy"). "Mark as bought" switches it to "owned".
export const itemStatuses = ["owned", "not_owned"] as const;
export type ItemStatus = (typeof itemStatuses)[number];

// ---------------------------------------------------------------------------
// Body profile: used for sizing hints and the ghost mannequin's proportions.
// Multipliers scale the base figure: 1 = average; >1 = wider.
// ---------------------------------------------------------------------------
export const genders = ["female", "male"] as const;
export type Gender = (typeof genders)[number];

export const genderProportions: Record<Gender, { shoulders: number; chest: number; waist: number; hips: number; neck: number }> = {
  female: { shoulders: 0.88, chest: 0.97, waist: 0.84, hips: 1.1, neck: 0.85 },
  male: { shoulders: 1, chest: 1, waist: 1, hips: 1, neck: 1 },
};

export const bodyShapes = [
  { id: "slim", shoulders: 0.94, waist: 0.88, hips: 0.94 },
  { id: "average", shoulders: 1, waist: 1, hips: 1 },
  { id: "athletic", shoulders: 1.1, waist: 0.94, hips: 0.98 },
  { id: "broad", shoulders: 1.14, waist: 1.12, hips: 1.08 },
] as const;
export type BodyShape = (typeof bodyShapes)[number]["id"];

export const bodyLimits = {
  heightCm: { min: 120, max: 220 },
  weightKg: { min: 30, max: 200 },
} as const;

// Used until someone fills in their profile.
export const defaultBody = {
  gender: "male" as Gender,
  heightCm: 175,
  weightKg: 70,
  shape: "average" as BodyShape,
};

// ---------------------------------------------------------------------------
// Photos & storage — tuned to stay well inside Supabase's free 1 GB.
// ---------------------------------------------------------------------------
export const storageConfig = {
  // Must match the bucket created in supabase/migrations/0001_init.sql
  itemPhotosBucket: "item-photos",
  // Photos are shrunk in the browser before upload: longest side in pixels.
  maxPhotoDimension: 1200,
  // 0–1. Lower = smaller files, slightly blurrier photos.
  photoQuality: 0.82,
  // How long a private photo link stays valid (seconds).
  signedUrlSeconds: 60 * 60,
} as const;

export const backgroundRemovalConfig = {
  // Set to false to hide the "Remove background" button entirely.
  enabled: true,
  // Runs fully in the browser (free). Models, small → large:
  //   "isnet_quint8" (~40 MB, fastest, struggles with dark clothes)
  //   "isnet_fp16"   (~80 MB, much better edges and dark fabric) ← default
  //   "isnet"        (~170 MB, best, slow on phones)
  // Downloaded once on first use, then cached by the browser.
  // The mask is cleaned up afterwards (holes filled) — see features/wardrobe/photo/refineCutout.ts.
  model: "isnet_fp16",
} as const;
