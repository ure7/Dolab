"use client";

import { useEffect, useState } from "react";
import { measureCutout } from "@/lib/try-on/measure";
import type { PhotoCrop } from "@/lib/try-on";

// Shows a background-free photo zoomed to the garment itself (no empty
// transparent border), so every item fills its tile nicely.
export function CutoutImage({ url, alt, className = "" }: { url: string; alt: string; className?: string }) {
  const [crop, setCrop] = useState<{ url: string; value: PhotoCrop | null } | null>(null);

  useEffect(() => {
    let live = true;
    measureCutout(url).then((value) => live && setCrop({ url, value }));
    return () => {
      live = false;
    };
  }, [url]);

  const box = crop?.url === url ? crop.value : null;
  if (!box) {
    return <img src={url} alt={alt} className={`object-contain ${className}`} />;
  }
  return (
    <svg viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} preserveAspectRatio="xMidYMid meet" className={className} role="img" aria-label={alt}>
      <image href={url} width={box.naturalWidth} height={box.naturalHeight} />
    </svg>
  );
}
