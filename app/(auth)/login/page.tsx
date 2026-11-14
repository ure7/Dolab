import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/features/auth/AuthCard";
import { AuthForm } from "@/features/auth/AuthForm";

export const metadata: Metadata = { title: "Log in" };

type LoginPageProps = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getT();
  const { error } = await searchParams;

  return (
    <AuthCard title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      {/* Set by /auth/callback when an email confirmation link fails. */}
      {error === "confirm" && (
        <div className="mb-4">
          <Alert tone="error">{t.auth.confirmFailed}</Alert>
        </div>
      )}
      <AuthForm mode="login" />
    </AuthCard>
  );
}
