type Tone = "error" | "success";

const toneClasses: Record<Tone, string> = {
  error: "border-danger/40 bg-danger/10 text-danger",
  success: "border-success/40 bg-success/10 text-success",
};

// role="alert" makes screen readers read the message out as soon as it appears.
export function Alert({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <div role="alert" className={`rounded-xl border px-3.5 py-2.5 text-sm ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
