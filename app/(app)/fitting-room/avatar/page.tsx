import { getT } from "@/lib/i18n/server";
import { getProfile } from "@/lib/db/profile";
import { toBodyProfile } from "@/lib/body/profile";
import { PageTitle } from "@/components/PageTitle";
import { AvatarForm } from "@/features/profile/AvatarForm";

export default async function AvatarPage() {
  const [t, profile] = await Promise.all([getT(), getProfile()]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <PageTitle>{t.avatar.title}</PageTitle>
        <p className="mt-1 text-sm text-muted">{t.avatar.subtitle}</p>
      </div>
      <AvatarForm initial={toBodyProfile(profile)} />
    </div>
  );
}
