import { appConfig, type Locale } from "@/config/dolab.config";

// Intl formats numbers and dates the way each language expects
// (e.g. Arabic uses Arabic-Indic digits).

export function formatPrice(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: appConfig.currency }).format(amount);
}

export function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(isoDate));
}
