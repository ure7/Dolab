import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:brightness-110",
  secondary: "bg-raised text-fg border border-line hover:border-muted",
  ghost: "text-muted hover:text-fg hover:bg-raised",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
};

// Exported separately so a <Link> can look like a button too.
export function buttonClasses(variant: Variant = "primary", extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
    "press min-h-11 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
    variantClasses[variant],
    extra,
  ].join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
