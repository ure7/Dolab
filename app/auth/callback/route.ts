import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { appConfig } from "@/config/dolab.config";
import { createClient } from "@/lib/supabase/server";

// The link in Supabase's confirmation email lands here. Depending on the
// email template it carries either `code` (default) or `token_hash` + `type`.
// We swap it for a login session, then send the user into the app.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let confirmed = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmed = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    confirmed = !error;
  }

  const destination = confirmed ? appConfig.homePath : "/login?error=confirm";
  return NextResponse.redirect(new URL(destination, request.url));
}
