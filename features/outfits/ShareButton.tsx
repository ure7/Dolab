"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { shareOutfit, stopSharing } from "./actions";

const linkFor = (token: string) => `${window.location.origin}/s/${token}`;

// "Share" → makes a public read-only link. On phones the system share sheet
// opens (WhatsApp, Messages…); otherwise the link is copied.
export function ShareButton({ outfitId, title, initialToken }: { outfitId: string; title: string; initialToken: string | null }) {
  const { t } = useI18n();
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const small = "min-h-9 px-3 py-1.5 text-xs";

  async function deliver(link: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: link });
        return;
      } catch {
        // cancelled or not allowed — fall back to copying
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setMessage(t.share.copied);
    } catch {
      setMessage(link); // last resort: show it so it can be copied by hand
    }
  }

  function share() {
    setMessage(null);
    start(async () => {
      const result = await shareOutfit(outfitId);
      if (result.status === "error" || !result.token) return setMessage(t.share.failed);
      setToken(result.token);
      await deliver(linkFor(result.token));
    });
  }

  function stop() {
    setMessage(null);
    start(async () => {
      const result = await stopSharing(outfitId);
      if (result.status === "error") return setMessage(t.share.failed);
      setToken(null);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="ghost" className={small} disabled={isPending} onClick={share}>
          {token ? t.share.copy : t.share.share}
        </Button>
        {token && (
          <Button variant="ghost" className={`${small} text-muted`} disabled={isPending} onClick={stop}>
            {t.share.stop}
          </Button>
        )}
      </div>
      {token && <p className="text-[0.7rem] text-success">{t.share.sharing}</p>}
      {message && (
        <p className="text-xs break-all text-muted" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
