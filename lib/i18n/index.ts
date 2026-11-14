import { locales, rtlLocales, type Locale } from "@/config/dolab.config";
import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";

export type Dictionary = typeof en;
export type { Locale };

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

// Cookie values come from the browser, so never trust them blindly.
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
