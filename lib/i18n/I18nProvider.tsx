"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/config/dolab.config";
import type { Dictionary } from "./index";

type I18nValue = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18nValue | null>(null);

// Server components can call getT() directly, but browser ("use client")
// components can't read cookies — so the root layout passes the text down here.
export function I18nProvider({ locale, t, children }: I18nValue & { children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

// Usage in a client component: const { t } = useI18n();
export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>.");
  return value;
}
