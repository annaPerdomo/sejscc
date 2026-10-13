"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { EmakiPhoto } from "@/components/centennial-emaki";

const NearbyContext = createContext(false);

// Native lazy loading never sees photos panned in from outside the clipped
// track, and eager ones would hold back the hero, so they load as the strip nears.
export function EmakiStrip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [nearby, setNearby] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearby(true);
        observer.disconnect();
      },
      { rootMargin: "200% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} className="emaki-strip">
      <NearbyContext.Provider value={nearby}>{children}</NearbyContext.Provider>
    </ul>
  );
}

export function EmakiImage({ photo }: { photo: EmakiPhoto }) {
  const nearby = useContext(NearbyContext);
  return (
    <Image
      src={photo.image}
      alt={photo.alt}
      sizes="(max-width: 640px) 110vw, 64rem"
      placeholder="blur"
      loading={nearby ? "eager" : "lazy"}
      className="emaki-photo"
    />
  );
}
