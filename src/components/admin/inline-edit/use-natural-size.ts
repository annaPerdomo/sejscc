"use client";

import { useEffect, useState } from "react";
import type { PhotoSize } from "@/lib/photo-resolution";

export function useNaturalSize(src: string | null): PhotoSize | null {
  const [size, setSize] = useState<{ src: string; size: PhotoSize } | null>(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setSize({ src, size: { width: image.naturalWidth, height: image.naturalHeight } });
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return size?.src === src ? size.size : null;
}
