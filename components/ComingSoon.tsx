import { getT } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";

// Temporary placeholder for pages that later phases will build.
export async function ComingSoon({ phase }: { phase: number }) {
  const t = await getT();
  return (
    <div className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
      {format(t.common.comingSoon, { phase })}
    </div>
  );
}
