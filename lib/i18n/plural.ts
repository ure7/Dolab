import type { Locale } from "@/config/dolab.config";
import { format } from "./format";

// Plural forms differ by language: English has "1 item / 2 items", Arabic has
// separate forms for 0, 1, 2, 3–10 and 11+. Intl.PluralRules picks the right
// one; dictionaries only list the forms their language needs (+ "other").
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export function plural(forms: PluralForms, count: number, locale: Locale): string {
  const rule = new Intl.PluralRules(locale).select(count);
  return format(forms[rule] ?? forms.other, { count });
}
