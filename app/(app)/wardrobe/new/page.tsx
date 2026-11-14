import { requireUserId } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { PageTitle } from "@/components/PageTitle";
import { ItemForm } from "@/features/wardrobe/ItemForm";

type NewItemPageProps = { searchParams: Promise<{ status?: string }> };

// /wardrobe/new                    → add something you own
// /wardrobe/new?status=not_owned   → "try before you buy" store item
export default async function NewItemPage({ searchParams }: NewItemPageProps) {
  const [userId, t, { status }] = await Promise.all([requireUserId(), getT(), searchParams]);
  const isStoreItem = status === "not_owned";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>{isStoreItem ? t.wardrobe.newStoreItemTitle : t.wardrobe.newItemTitle}</PageTitle>
        {isStoreItem && <p className="mt-2 max-w-2xl text-sm text-muted">{t.wardrobe.newStoreItemHint}</p>}
      </div>
      <ItemForm userId={userId} defaultStatus={isStoreItem ? "not_owned" : "owned"} />
    </div>
  );
}
