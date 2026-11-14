import { getT } from "@/lib/i18n/server";
import { PageTitle } from "@/components/PageTitle";
import { ComingSoon } from "@/components/ComingSoon";

export default async function ShoppingPage() {
  const t = await getT();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{t.pages.shopping}</PageTitle>
      <ComingSoon phase={5} />
    </div>
  );
}
