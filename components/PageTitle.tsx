export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-[clamp(1.5rem,1.2rem+0.9vw,2.25rem)] font-semibold tracking-tight">{children}</h1>;
}
