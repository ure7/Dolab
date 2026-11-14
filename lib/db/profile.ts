import type { Profile } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/auth";

// The logged-in user's profile row (name, budget, body measurements).
// Returns null if the row can't be read — callers fall back to defaults.
export async function getProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}
