import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { requireUserId } from "@/lib/auth";
import { getItem } from "@/lib/db/items";
import { getLocale, getT } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { plural } from "@/lib/i18n/plural";
import { formatDate } from "@/lib/helpers/format";
import { PageTitle } from "@/components/PageTitle";
import { ItemForm } from "@/features/wardrobe/ItemForm";
import { DeleteItemButton, MarkAsBoughtButton } from "@/features/wardrobe/ItemActions";
import { AddFromItemButton } from "@/features/shopping/ShoppingParts";
import { createClient } from "@/lib/supabase/server";
import { pageTitle } from "@/lib/i18n/metadata";

type EditItemPageProps = { params: Promise<{ id: string }> };


export const generateMetadata = pageTitle((t) => t.wardrobe.editItemTitle);

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { id } = await params;
  const [userId, t, locale, item] = await Promise.all([requireUserId(), getT(), getLocale(), getItem(id)]);

  // RLS means someone else's item id also comes back empty → plain 404.
  if (!item) notFound();

  // Is this "not owned yet" item already on the shopping list?
  const supabase = await createClient();
  const { count } = await supabase.from("shopping_items").select("id", { count: "exact", head: true }).eq("item_id", item.id);
  const onShoppingList = (count ?? 0) > 0;

  // How often has this been worn? (wear tracker)
  const { data: wears } = await supabase.from("wear_logs").select("worn_on").eq("item_id", item.id).order("worn_on", { ascending: false });
  const timesWorn = wears?.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <PageTitle>{t.wardrobe.editItemTitle}</PageTitle>
          {item.status === "owned" && (
            <p className="text-sm text-muted">
              {timesWorn > 0
                ? `${plural(t.wear.timesWorn, timesWorn, locale)} · ${format(t.wear.lastWorn, { date: formatDate(wears![0].worn_on, locale) })}`
                : t.wear.neverWorn}
            </p>
          )}
          {item.bought_at && (
            <p className="text-sm text-muted">{format(t.wardrobe.boughtOn, { date: formatDate(item.bought_at, locale) })}</p>
          )}
        </div>
        <Link href={`/fitting-room?with=${item.id}`} className={buttonClasses("secondary")}>
          {t.fittingRoom.tryOn}
        </Link>
      </div>

      {item.status === "not_owned" && (
        <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <MarkAsBoughtButton id={item.id} />
          <AddFromItemButton itemId={item.id} reason="buy" onList={onShoppingList} label={t.shopping.addToShopping} />
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
