// Grey placeholder shapes shown while a page loads (Next.js shows a route's
// loading.tsx instantly, then swaps in the real page).
type PageSkeletonProps = {
  /** "grid" = cards (wardrobe, outfits); "split" = big panel + side column (fitting room, shopping). */
  layout: "grid" | "split";
  /** Card shape for grids. */
  aspect?: "square" | "portrait";
};

export function PageSkeleton({ layout, aspect = "square" }: PageSkeletonProps) {
  return (
    <div className="flex animate-pulse flex-col gap-6 motion-reduce:animate-none" aria-busy aria-live="polite">
      <div className="h-9 w-56 max-w-full rounded-lg bg-surface" />
      {layout === "grid" ? (
        <>
          <div className="h-11 rounded-xl bg-surface" />
          <div className="grid grid-cols-2 gap-[clamp(0.75rem,1.2vw,1.25rem)] md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className={`${aspect === "square" ? "aspect-[4/5]" : "aspect-[3/5]"} rounded-2xl bg-surface`} />
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="aspect-4/5 rounded-3xl bg-surface" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-surface" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
