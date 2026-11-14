import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Returns the logged-in user's id, or sends them to /login.
// proxy.ts already guards pages; this is a second lock on the door for
// server code, as the Next.js docs recommend.
export async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) redirect("/login");
  return userId;
}
