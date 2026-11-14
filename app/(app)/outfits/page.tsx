import { getT } from "@/lib/i18n/server";
import { PageTitle } from "@/components/PageTitle";
import { ComingSoon } from "@/components/ComingSoon";

export default async function OutfitsPage() {
  const t = await getT();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{t.pages.outfits}</PageTitle>
      <ComingSoon phase={4} />
    </div>
  );
}
