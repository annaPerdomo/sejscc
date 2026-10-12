"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const BOTTOM_GAP = 24;

const STICKY_QUERY = "(min-width: 64rem)";

// The element's `scroll-mt-*` is the clearance below the sticky site header.
// `null` below `lg`: there a `top` would shift a positioned panel out of place.
export function useStickyTop(ref: RefObject<HTMLElement | null>): number | null {
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const sticky = window.matchMedia(STICKY_QUERY);

    function measure() {
      if (!element) return;
      if (!sticky.matches) {
        setTop(null);
        return;
      }
      const clearance = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      setTop(Math.min(clearance, window.innerHeight - element.offsetHeight - BOTTOM_GAP));
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    sticky.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      sticky.removeEventListener("change", measure);
    };
  }, [ref]);

  return top;
}

export function StickyColumn({
  children,
  className = "",
  panelClassName = "",
}: {
  children: ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const top = useStickyTop(ref);

  return (
    <div className={className}>
      <div
        ref={ref}
        className={`lg:sticky ${panelClassName}`}
        style={top === null ? undefined : { top }}
      >
        {children}
      </div>
    </div>
  );
}
