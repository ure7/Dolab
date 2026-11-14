"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseBodyForm, type BodyErrorKey } from "./validation";

export type BodyActionResult = { status: "error"; errorKey: BodyErrorKey };

// Postgres "column does not exist" / Supabase "column not in schema cache":
// both mean migration 0003 hasn't been run yet.
const MISSING_COLUMN_CODES = ["42703", "PGRST204"];

export async function saveBodyProfile(formData: FormData): Promise<BodyActionResult> {
  const userId = await requireUserId();
  const parsed = parseBodyForm(formData);
  if (!parsed.ok) return { status: "error", errorKey: parsed.errorKey };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error) {
    return { status: "error", errorKey: MISSING_COLUMN_CODES.includes(error.code) ? "migrationMissing" : "saveFailed" };
  }

  revalidatePath("/fitting-room");
  redirect("/fitting-room");
}
