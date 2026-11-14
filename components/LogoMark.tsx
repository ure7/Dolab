import { theme } from "@/config/dolab.config";

// The Dolab mark: a minimal two-door wardrobe on a wood-coloured tile.
// Kept in sync with app/icon.svg (the favicon) — if you redesign one, update both.
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill={theme.accent} />
      <g fill="none" stroke={theme.accentText} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        {/* body */}
        <rect x="17" y="11" width="30" height="37" rx="3.5" />
        {/* centre seam between the two doors */}
        <path d="M32 11v37" />
        {/* handles */}
        <path d="M28 26v6M36 26v6" />
        {/* feet */}
        <path d="M21 48v5M43 48v5" />
      </g>
    </svg>
  );
}
