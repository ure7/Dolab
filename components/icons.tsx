import type { SVGProps } from "react";

// Small inline icons (no icon library needed). They use currentColor, so they
// take the text colour of whatever they're placed in.
type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function HangerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 7a2 2 0 1 1 2-2" />
      <path d="M12 7v1.5L3 15a1.5 1.5 0 0 0 .9 2.7h16.2A1.5 1.5 0 0 0 21 15l-9-6.5" />
    </svg>
  );
}

export function MannequinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="4" r="2" />
      <path d="M8 8h8l-1 7H9z" />
      <path d="M10 15l-1 6M14 15l1 6" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      {/* Door on the left, arrow leaving it to the right ("going out"). */}
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 7l5 5-5 5M20 12H9" />
    </svg>
  );
}

// Lets the nav config refer to icons by name ("hanger") instead of importing components.
export const iconsByName = {
  hanger: HangerIcon,
  mannequin: MannequinIcon,
  grid: GridIcon,
  bag: BagIcon,
} as const;
