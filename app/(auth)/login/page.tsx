import { getT } from "@/lib/i18n/server";
import { Alert } from "@/components/ui/Alert";
import { AuthCard } from "@/features/auth/AuthCard";
import { AuthForm } from "@/features/auth/AuthForm";
import { pageTitle } from "@/lib/i18n/metadata";


type LoginPageProps = { searchParams: Promise<{ error?: string }> };


export const generateMetadata = pageTitle((t) => t.auth.loginButton);

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
