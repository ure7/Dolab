import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 runs this before every matching request (it was called "middleware" before v16).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, images and the installable-app files — they don't need a login check.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|offline\\.html|manifest\\.webmanifest|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
