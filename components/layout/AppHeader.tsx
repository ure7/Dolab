import { Logo } from "@/components/Logo";
import { getT } from "@/lib/i18n/server";
import { NavLinks } from "./NavLinks";
import { LanguageToggle } from "./LanguageToggle";
import { SignOutButton } from "./SignOutButton";
import { ProductTour } from "./ProductTour";

// Top bar for logged-in pages. On phones the page links move to <BottomNav />.
export async function AppHeader() {
  const t = await getT();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="page-container flex h-16 items-center justify-between gap-2 sm:gap-3">
        <Logo />
        <nav aria-label={t.common.mainNav}>
          <NavLinks variant="top" />
        </nav>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <ProductTour />
          <LanguageToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
