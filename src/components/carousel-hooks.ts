import { useEffect, useState, type RefObject } from "react";

export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduceMotion;
}

// A slideshow below the fold would otherwise run through its slides before
// anyone scrolls to it.
export function useInView(
  ref: RefObject<HTMLElement | null>,
  threshold = 0.2,
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}

// Mounting every image up front would download them all on page load;
// unmounting one mid-rotation would blank the outgoing side of the crossfade.
export function useMountedAround(active: number, count: number) {
  const next = (active + 1) % Math.max(count, 1);
  const [mounted, setMounted] = useState(() =>
    Array.from(new Set([active, next])),
  );
  if (!mounted.includes(active) || !mounted.includes(next)) {
    setMounted(Array.from(new Set([...mounted, active, next])));
  }
  return mounted;
}
