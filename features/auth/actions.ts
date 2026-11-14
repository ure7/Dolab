"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig } from "@/config/dolab.config";
import { createClient } from "@/lib/supabase/server";
import type { AuthState } from "./types";

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

// Builds the link in the confirmation email, e.g. https://dolab.vercel.app/auth/callback
async function getCallbackUrl(): Promise<string> {
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;
  return `${origin}/auth/callback`;
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = readText(formData, "email");
  const { error } = await supabase.auth.signInWithPassword({
    email,
    // Passwords are not trimmed — spaces can be part of a password.
    password: String(formData.get("password") ?? ""),
  });

  // Same message for "no such user" and "wrong password", so nobody can use
  // the login form to find out which emails have accounts.
  if (error) return { status: "error", messageKey: "invalidLogin", email };

  redirect(appConfig.homePath);
}

export async function signUp(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = readText(formData, "email");
  const { data, error } = await supabase.auth.signUp({
    email,
    password: String(formData.get("password") ?? ""),
    options: {
      emailRedirectTo: await getCallbackUrl(),
      // Picked up by the handle_new_user trigger to fill profiles.display_name.
      data: { display_name: readText(formData, "displayName") },
    },
  });

  if (error) return { status: "error", messageKey: "signupFailed", detail: error.message, email };

  // If "Confirm email" is turned off in Supabase, the user is logged in straight away.
  if (data.session) redirect(appConfig.homePath);

  return { status: "checkEmail" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
