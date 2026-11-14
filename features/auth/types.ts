import type { Dictionary } from "@/lib/i18n";

// What the auth form shows after submitting. Messages are dictionary keys
// (not raw text) so they appear in the user's language.
export type AuthState =
  | { status: "idle" }
  // email is sent back so the form can refill it (React clears forms after submitting).
  | { status: "error"; messageKey: keyof Dictionary["auth"]; detail?: string; email?: string }
  | { status: "checkEmail" };

export const initialAuthState: AuthState = { status: "idle" };
