import { getT } from "@/lib/i18n/server";
import { NavLinks } from "./NavLinks";

// Phone-only tab bar, within thumb reach. Hidden from medium screens up,
// where the links sit in the header instead.
export async function BottomNav() {
  const t = await getT();
  return (
    <nav
      aria-label={t.common.mainNav}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <NavLinks variant="bottom" />
    </nav>
  );
}
