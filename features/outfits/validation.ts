import type { Dictionary } from "@/lib/i18n";

export type OutfitErrorKey = keyof Dictionary["outfits"]["errors"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

/** Trimmed text; empty → null; too long → undefined (an error). */
export function cleanText(value: unknown, maxLength: number): string | null | undefined {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.length <= maxLength ? text : undefined;
}
