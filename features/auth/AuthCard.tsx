// The framed box around the login / sign-up form.
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-2xl shadow-black/40 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-muted">{subtitle}</p>
      {children}
    </section>
  );
}
