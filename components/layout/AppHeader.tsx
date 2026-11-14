import { Logo } from "@/components/Logo";
import { NavLinks } from "./NavLinks";
import { LanguageToggle } from "./LanguageToggle";
import { SignOutButton } from "./SignOutButton";

// Top bar for logged-in pages. On phones the page links move to <BottomNav />.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label="Main">
          <NavLinks variant="top" />
        </nav>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
