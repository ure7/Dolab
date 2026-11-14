import { cookies } from "next/headers";
import { defaultLocale, localeCookieName, type Locale } from "@/config/dolab.config";
import { getDictionary, isLocale, type Dictionary } from "./index";

// The chosen language is stored in a cookie, so URLs stay simple (/wardrobe, not /ar/wardrobe).
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}

// Shortcut for server components: const t = await getT();
export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}
