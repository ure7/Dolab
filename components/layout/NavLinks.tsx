"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/config/dolab.config";
import { iconsByName } from "@/components/icons";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Variant = "top" | "bottom";

const listClasses: Record<Variant, string> = {
  top: "hidden items-center gap-1 md:flex",
  bottom: "grid grid-cols-4",
};

const linkClasses: Record<Variant, string> = {
  top: "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
  bottom: "flex flex-col items-center gap-1 py-2.5 text-[11px]",
};

// One component for both the desktop top bar and the mobile bottom tab bar,
// so the list of pages is only defined once (in dolab.config.ts).
export function NavLinks({ variant }: { variant: Variant }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <ul className={listClasses[variant]}>
      {navItems.map(({ href, labelKey, icon }) => {
        const Icon = iconsByName[icon];
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`${linkClasses[variant]} transition ${
                isActive ? "text-accent" : "text-muted hover:text-fg"
              } ${isActive && variant === "top" ? "bg-raised" : ""}`}
            >
              <Icon width={variant === "top" ? 18 : 22} height={variant === "top" ? 18 : 22} />
              <span>{t.nav[labelKey]}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
