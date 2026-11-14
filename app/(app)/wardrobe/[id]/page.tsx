import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { requireUserId } from "@/lib/auth";
import { getItem } from "@/lib/db/items";
import { getLocale, getT } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { formatDate } from "@/lib/helpers/format";
import { PageTitle } from "@/components/PageTitle";
import { ItemForm } from "@/features/wardrobe/ItemForm";
import { DeleteItemButton, MarkAsBoughtButton } from "@/features/wardrobe/ItemActions";

type EditItemPageProps = { params: Promise<{ id: string }> };

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { id } = await params;
  const [userId, t, locale, item] = await Promise.all([requireUserId(), getT(), getLocale(), getItem(id)]);

  // RLS means someone else's item id also comes back empty → plain 404.
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <PageTitle>{t.wardrobe.editItemTitle}</PageTitle>
          {item.bought_at && (
            <p className="text-sm text-muted">{format(t.wardrobe.boughtOn, { date: formatDate(item.bought_at, locale) })}</p>
          )}
        </div>
        <Link href={`/fitting-room?with=${item.id}`} className={buttonClasses("secondary")}>
          {t.fittingRoom.tryOn}
        </Link>
      </div>

      {item.status === "not_owned" && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <MarkAsBoughtButton id={item.id} />
        </div>
      )}

      {/* key: when the item changes on the server (e.g. "I bought it"), React
          rebuilds the form from fresh data instead of keeping stale field values. */}
      <ItemForm key={item.updated_at} userId={userId} item={item} />

      <div className="border-t border-line pt-6 md:max-w-sm">
        <DeleteItemButton id={item.id} name={item.name} />
      </div>
    </div>
  );
}
