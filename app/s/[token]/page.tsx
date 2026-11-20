import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { storageConfig, type CategoryId, type ColourId, type ItemStatus } from "@/config/dolab.config";
import { getT } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/format";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { buttonClasses } from "@/components/ui/Button";
import { OutfitBoard } from "@/features/fitting-room/OutfitBoard";
import type { FittingRoomItem } from "@/features/fitting-room/types";

// Public, read-only page for a shared outfit: /s/<secret code>.
// No login needed. The database function get_shared_outfit() returns ONLY the
// outfit with this code, and storage only lets visitors open ITS photos.

type SharedItem = {
  id: string;
  name: string;
  category: CategoryId;
  colour: ColourId;
  status: ItemStatus;
  photo_path: string | null;
  cutout_path: string | null;
};
type SharedOutfit = { code: string; name: string | null; jacket_open: boolean; items: SharedItem[] };

type SharePageProps = { params: Promise<{ token: string }> };

const TOKEN = /^[A-Za-z0-9_-]{20,64}$/;

// cache(): the page and its <title> both need the outfit, but it is loaded once.
const loadShared = cache(async (token: string): Promise<{ outfit: SharedOutfit; items: FittingRoomItem[] } | null> => {
  if (!TOKEN.test(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_outfit", { p_token: token });
  const outfit = data as SharedOutfit | null;
  if (!outfit) return null;

  // Short-lived links to just this outfit's photos.
  const paths = outfit.items.flatMap((i) => [i.photo_path, i.cutout_path]).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(storageConfig.itemPhotosBucket).createSignedUrls(paths, storageConfig.signedUrlSeconds);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  const items = outfit.items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    colour: i.colour,
    status: i.status,
    photoUrl: i.photo_path ? (urls.get(i.photo_path) ?? null) : null,
    cutoutUrl: i.cutout_path ? (urls.get(i.cutout_path) ?? null) : null,
    price: null, // prices are private
    storeName: null,
  }));
  return { outfit, items };
});

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const t = await getT();
  const shared = await loadShared((await params).token);
  const title = shared ? shared.outfit.name || format(t.outfits.untitled, { code: shared.outfit.code }) : t.share.gone;
  // Private links: keep them out of search engines.
  return { title, robots: { index: false, follow: false } };
}

export default async function SharedOutfitPage({ params }: SharePageProps) {
  const t = await getT();
  const shared = await loadShared((await params).token);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="page-container flex h-16 items-center justify-between gap-3">
          <Logo href="/" />
          <LanguageToggle />
        </div>
      </header>
      <main className="page-container flex flex-1 flex-col items-center gap-5 py-[clamp(1.5rem,3vw,3rem)] text-center">
        {shared ? (
          <>
            <div>
              <p className="text-sm text-muted">{t.share.sharedHeading}</p>
              <h1 className="mt-1 text-[clamp(1.5rem,1.2rem+0.9vw,2.25rem)] font-semibold">
                {shared.outfit.name || format(t.outfits.untitled, { code: shared.outfit.code })}
              </h1>
            </div>
            <div className="w-full max-w-[min(100%,calc((100dvh-14rem)*0.8))]">
              <OutfitBoard items={shared.items} />
            </div>
            <p className="text-sm text-muted">
              {shared.items.map((i) => i.name).join(" · ")}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-16">
            <h1 className="text-2xl font-semibold">{t.share.gone}</h1>
            <p className="max-w-md text-muted">{t.share.goneBody}</p>
          </div>
        )}
        <p className="mt-auto pt-6 text-xs text-muted">{t.share.madeWith}</p>
        <Link href="/" className={buttonClasses("secondary")}>
          {t.share.getDolab}
        </Link>
      </main>
    </div>
  );
}
