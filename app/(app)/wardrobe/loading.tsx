// Shown instantly while the wardrobe loads (Next.js picks up loading.tsx automatically).
export default function WardrobeLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy>
      <div className="h-8 w-48 rounded-lg bg-surface" />
      <div className="h-10 rounded-xl bg-surface" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[4/5] rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
