import { getT } from "@/lib/i18n/server";
import { AuthCard } from "@/features/auth/AuthCard";
import { AuthForm } from "@/features/auth/AuthForm";
import { pageTitle } from "@/lib/i18n/metadata";



export const generateMetadata = pageTitle((t) => t.auth.signupButton);

export default async function SignupPage() {
  const t = await getT();

  return (
    <AuthCard title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
