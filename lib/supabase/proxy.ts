import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appConfig } from "@/config/dolab.config";
import { getSupabaseEnv } from "./env";

// Pages anyone can open without logging in.
const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/s"]; // "/s/…" = shared outfits
// Pages that make no sense once you're logged in.
const GUEST_ONLY_PATHS = ["/login", "/signup"];

function startsWithAny(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

// Runs before every page request: refreshes the login session (Supabase
// tokens expire) and sends visitors to the right place.
export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Copy refreshed cookies onto both the request (for this render)
        // and the response (so the browser stores them).
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims() verifies the token, so it can't be faked by editing a cookie.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isLoggedIn && !startsWithAny(pathname, PUBLIC_PATHS)) {
    return redirectTo(request, "/login");
  }
  if (isLoggedIn && startsWithAny(pathname, GUEST_ONLY_PATHS)) {
    return redirectTo(request, appConfig.homePath);
  }
  return response;
}
