"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CarouselArrow } from "@/components/carousel-arrow";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";

const ADVANCE_MS = 7000;

export function EventsCarousel({
  children,
  prevLabel,
  nextLabel,
  pauseLabel,
  playLabel,
}: {
  children: ReactNode;
  prevLabel: string;
  nextLabel: string;
  pauseLabel: string;
  playLabel: string;
}) {
  const count = Children.count(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [stopped, setStopped] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    const amount = (card?.offsetWidth ?? 340) + gap;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (stopped || hoverPaused || focusPaused || reduceMotion) return;
    if (count < 2) return;
    const id = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const atEnd =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      if (atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
      else scrollByCard(1);
    }, ADVANCE_MS);
    return () => clearInterval(id);
  }, [stopped, hoverPaused, focusPaused, reduceMotion, count, scrollByCard]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
    >
      <div className="relative">
        {count > 1 && (
          <>
            <CarouselArrow
              direction={-1}
              label={prevLabel}
              onClick={() => scrollByCard(-1)}
              className="absolute top-1/2 -left-5 z-10 hidden h-11 w-11 -translate-y-1/2 shadow-lg sm:flex lg:-left-6"
            />
            <CarouselArrow
              direction={1}
              label={nextLabel}
              onClick={() => scrollByCard(1)}
              className="absolute top-1/2 -right-5 z-10 hidden h-11 w-11 -translate-y-1/2 shadow-lg sm:flex lg:-right-6"
            />
          </>
        )}
        <div
          ref={trackRef}
          // `overflow-x: auto` clips vertically too: the padding is the hover
          // lift's room, -mx undoes it, scroll-px keeps it across a snap.
          className="event-track -mx-3 snap-x snap-mandatory scroll-px-3 overflow-x-auto scroll-smooth px-3 py-6"
          // Touch has no "leave" event to resume on, so it stops the carousel
          // outright rather than pausing invisibly.
          onTouchStart={() => setStopped(true)}
        >
          {children}
        </div>
      </div>
      {count > 1 && (
        <div className="flex justify-end gap-2">
          <CarouselPlayToggle
            stopped={stopped}
            onToggle={() => setStopped((value) => !value)}
            pauseLabel={pauseLabel}
            playLabel={playLabel}
          />
          <CarouselArrow
            direction={-1}
            label={prevLabel}
            onClick={() => scrollByCard(-1)}
            className="sm:hidden"
          />
          <CarouselArrow
            direction={1}
            label={nextLabel}
            onClick={() => scrollByCard(1)}
            className="sm:hidden"
          />
        </div>
      )}
    </div>
  );
}
