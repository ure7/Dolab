import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Returns the logged-in user's id, or sends them to /login.
// proxy.ts already guards pages; this is a second lock on the door for
// server code, as the Next.js docs recommend.
// cache(): a page calls this from several helpers; the check runs once per request.
export const requireUserId = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) redirect("/login");
  return userId;
});
