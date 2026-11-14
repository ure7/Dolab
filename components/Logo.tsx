import Link from "next/link";
import { appConfig } from "@/config/dolab.config";
import { LogoMark } from "./LogoMark";

// Mark + "Dolab | دولاب". Both names always show, whatever the language — it's the brand.
export function Logo({ href = appConfig.homePath }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-fg" aria-label="Dolab — دولاب">
      <LogoMark size={36} />
      <Wordmark />
    </Link>
  );
}

export function Wordmark({ className = "text-lg" }: { className?: string }) {
  return (
    <span className={`flex items-baseline gap-2 font-semibold tracking-tight ${className}`}>
      <span lang="en">{appConfig.name.en}</span>
      <span className="text-line" aria-hidden>
        |
      </span>
      <span lang="ar" className="text-accent">
        {appConfig.name.ar}
      </span>
    </span>
  );
}
