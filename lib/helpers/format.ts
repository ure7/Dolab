import { appConfig, type Locale } from "@/config/dolab.config";

// Intl formats numbers and dates the way each language expects.

// Prices are wrapped in invisible Unicode marks that keep them left-to-right
// (LRI U+2066 … PDI U+2069). Without them, inside Arabic text the currency
// sign gets reordered and "US$ 74.90" shows up as "$US 74.90".
const LRI = String.fromCharCode(0x2066); // "left-to-right isolate"
const PDI = String.fromCharCode(0x2069); // "pop directional isolate"
const isolate = (text: string) => `${LRI}${text}${PDI}`;

export function formatPrice(amount: number, locale: Locale): string {
  return isolate(new Intl.NumberFormat(locale, { style: "currency", currency: appConfig.currency }).format(amount));
}

export function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(isoDate));
}
