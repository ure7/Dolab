import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { AuthCard } from "@/features/auth/AuthCard";
import { AuthForm } from "@/features/auth/AuthForm";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage() {
  const t = await getT();

  return (
    <AuthCard title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
