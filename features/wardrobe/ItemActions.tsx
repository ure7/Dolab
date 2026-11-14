"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { format } from "@/lib/i18n/format";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { deleteItem, markAsBought } from "./actions";
import type { ItemErrorKey } from "./validation";

// Runs a server action from a button and shows its error, if any.
function useItemAction() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<ItemErrorKey | null>(null);

  function run(action: () => Promise<{ errorKey: ItemErrorKey } | undefined>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result) setError(result.errorKey);
    });
  }
  return { isPending, error, run };
}

export function DeleteItemButton({ id, name }: { id: string; name: string }) {
  const { t } = useI18n();
  const { isPending, error, run } = useItemAction();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="danger"
        disabled={isPending}
        onClick={() => {
          if (window.confirm(format(t.wardrobe.confirmDelete, { name }))) run(() => deleteItem(id));
        }}
      >
        {isPending ? t.common.working : t.wardrobe.delete}
      </Button>
      {error && <Alert tone="error">{t.wardrobe.errors[error]}</Alert>}
    </div>
  );
}

export function MarkAsBoughtButton({ id }: { id: string }) {
  const { t } = useI18n();
  const { isPending, error, run } = useItemAction();

  return (
    <div className="flex flex-col gap-2">
      <Button disabled={isPending} onClick={() => run(() => markAsBought(id))}>
        {isPending ? t.common.working : t.wardrobe.markAsBought}
      </Button>
      {error && <Alert tone="error">{t.wardrobe.errors[error]}</Alert>}
    </div>
  );
}
