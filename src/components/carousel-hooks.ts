import {
  useEffect,
  useState,
  type AnimationEvent,
  type FocusEvent,
  type RefObject,
} from "react";

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

// A middle-of-screen band, not a visible-fraction threshold: a fraction never
// trips for an element taller than the screen.
export function useInView(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "-25% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

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

// No hover hold: phones never send mouseleave after a tap, and Chrome keeps
// focus on a clicked button, so either would hold rotation indefinitely.
export function useRotation({
  count,
  viewRef,
  start = 0,
  held = false,
}: {
  count: number;
  viewRef: RefObject<HTMLElement | null>;
  start?: number;
  held?: boolean;
}) {
  const [index, setIndex] = useState(start);
  const [cycle, setCycle] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [focusHeld, setFocusHeld] = useState(false);
  const inView = useInView(viewRef);
  const reduceMotion = useReducedMotion();

  const active = index < count ? index : 0;
  const canRotate = count > 1 && !reduceMotion;
  const rotating = canRotate && !stopped;
  const paused = held || focusHeld || !inView;

  const show = (next: number) => {
    setIndex(next);
    setCycle((c) => c + 1);
  };

  const advance = (event: AnimationEvent<HTMLElement>) => {
    if (event.animationName !== "tab-progress") return;
    show((active + 1) % count);
  };

  const restart = () => setCycle((c) => c + 1);

  // Otherwise Play pressed from the keyboard stays held by its own focus.
  const toggle = () => {
    if (stopped) setFocusHeld(false);
    setStopped(!stopped);
  };

  const focusProps = {
    onFocus: (event: FocusEvent<HTMLElement>) =>
      setFocusHeld(event.target.matches(":focus-visible")),
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setFocusHeld(false);
      }
    },
  };

  return {
    active,
    cycle,
    canRotate,
    rotating,
    paused,
    stopped,
    reduceMotion,
    show,
    advance,
    restart,
    toggle,
    focusProps,
  };
}

export type Rotation = ReturnType<typeof useRotation>;
