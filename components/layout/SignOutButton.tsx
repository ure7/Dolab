import { signOut } from "@/features/auth/actions";
import { getT } from "@/lib/i18n/server";
import { buttonClasses } from "@/components/ui/Button";
import { LogoutIcon } from "@/components/icons";

export async function SignOutButton() {
  const t = await getT();

  return (
    <form action={signOut}>
      <button type="submit" className={buttonClasses("ghost", "px-2.5 py-2 sm:px-3")} aria-label={t.common.signOut}>
        <LogoutIcon width={18} height={18} className="rtl:-scale-x-100" />
        <span className="hidden lg:inline">{t.common.signOut}</span>
      </button>
    </form>
  );
}
