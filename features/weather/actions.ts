"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cleanText } from "@/features/outfits/validation";

/** Saves the place used for weather-based ideas. `city` null = "My location". */
export async function setWeatherLocation(city: string | null, latitude: number, longitude: number): Promise<{ status: "ok" | "error" }> {
  const userId = await requireUserId();
  const name = cleanText(city, 80);
  const valid =
    Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 && name !== undefined;
  if (!valid) return { status: "error" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ city: name, latitude: Math.round(latitude * 1e5) / 1e5, longitude: Math.round(longitude * 1e5) / 1e5 })
    .eq("id", userId);
  if (error) return { status: "error" };
  revalidatePath("/outfits");
  return { status: "ok" };
}
