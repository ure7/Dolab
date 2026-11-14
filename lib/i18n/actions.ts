"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { localeCookieName } from "@/config/dolab.config";
import { isLocale } from "./index";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

// Called by the language toggle button. Saves the choice and re-renders every
// page so the text and the left/right direction switch together.
export async function setLocale(formData: FormData) {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;

  (await cookies()).set(localeCookieName, locale, {
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
