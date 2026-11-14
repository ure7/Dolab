"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { TextField } from "@/components/ui/TextField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { signIn, signUp } from "./actions";
import { initialAuthState } from "./types";

type Mode = "login" | "signup";

// Shared by /login and /signup — they only differ in one field and the wording.
export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(mode === "login" ? signIn : signUp, initialAuthState);

  if (state.status === "checkEmail") {
    return <Alert tone="success">{t.auth.checkEmail}</Alert>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "error" && (
        <Alert tone="error">
          {t.auth[state.messageKey]}
          {state.detail && <span className="mt-1 block text-xs opacity-80">{state.detail}</span>}
        </Alert>
      )}

      {mode === "signup" && (
        <TextField label={t.auth.displayName} name="displayName" autoComplete="name" maxLength={60} required />
      )}
      <TextField
        label={t.auth.email}
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.status === "error" ? state.email : undefined}
        // key forces React to apply the refilled value after each failed attempt.
        key={state.status === "error" ? `email-${state.email}` : "email"}
        dir="ltr"
        required
      />
      <TextField
        label={t.auth.password}
        name="password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        minLength={6}
        hint={mode === "signup" ? t.auth.passwordHint : undefined}
        dir="ltr"
        required
      />

      <SubmitButton className="mt-2 w-full">
        {mode === "login" ? t.auth.loginButton : t.auth.signupButton}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? t.auth.noAccount : t.auth.haveAccount}{" "}
        <Link href={mode === "login" ? "/signup" : "/login"} className="font-medium text-accent hover:underline">
          {mode === "login" ? t.auth.goToSignup : t.auth.goToLogin}
        </Link>
      </p>
    </form>
  );
}
