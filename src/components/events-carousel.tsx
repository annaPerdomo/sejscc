"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import { EventMedia } from "@/components/event-media";
import { EventMeta } from "@/components/event-meta";
import { EventSignupLink } from "@/components/event-signup-link";

const ADVANCE_MS = 7000;

export type CarouselEvent = {
  id: string;
  href: string;
  title: string;
  date: string | null;
  time: string | null;
  repeat: string | null;
  signupUrl: string | null;
  location: string | null;
  description: string | null;
  flyerUrl: string | null;
  flyerAlt: string;
};

function Chevron({ direction }: { direction: 1 | -1 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d={direction === 1 ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EventsCarousel({
  events,
  nextUpLabel,
  signupLabel,
  signupAriaLabel,
  prevLabel,
  nextLabel,
  pauseLabel,
  playLabel,
  detailsLabel,
}: {
  events: CarouselEvent[];
  nextUpLabel: string;
  signupLabel: string;
  signupAriaLabel: string;
  prevLabel: string;
  nextLabel: string;
  pauseLabel: string;
  playLabel: string;
  detailsLabel: string;
}) {
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
    if (events.length < 2) return;
    const id = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const atEnd =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      if (atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
      else scrollByCard(1);
    }, ADVANCE_MS);
    return () => clearInterval(id);
  }, [
    stopped,
    hoverPaused,
    focusPaused,
    reduceMotion,
    events.length,
    scrollByCard,
  ]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
    >
      {events.length > 1 && (
        <div className="mb-4 flex justify-end gap-2">
          <CarouselPlayToggle
            stopped={stopped}
            onToggle={() => setStopped((value) => !value)}
            pauseLabel={pauseLabel}
            playLabel={playLabel}
          />
          <button
            type="button"
            aria-label={prevLabel}
            onClick={() => scrollByCard(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-indigo sm:hidden"
          >
            <Chevron direction={-1} />
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => scrollByCard(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-indigo sm:hidden"
          >
            <Chevron direction={1} />
          </button>
        </div>
      )}
      <div className="relative">
        {events.length > 1 && (
          <>
            <button
              type="button"
              aria-label={prevLabel}
              onClick={() => scrollByCard(-1)}
              className="absolute top-1/2 -left-5 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-indigo shadow-lg hover:bg-indigo hover:text-white sm:flex lg:-left-6"
            >
              <Chevron direction={-1} />
            </button>
            <button
              type="button"
              aria-label={nextLabel}
              onClick={() => scrollByCard(1)}
              className="absolute top-1/2 -right-5 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-indigo shadow-lg hover:bg-indigo hover:text-white sm:flex lg:-right-6"
            >
              <Chevron direction={1} />
            </button>
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
          {events.map((event, i) => (
            <div
              key={event.id}
              data-card
              className={`surface-card surface-card-link group relative flex snap-start flex-col overflow-clip rounded-none p-3.5 ${
                i === 0 ? "border-2 border-indigo" : ""
              }`}
            >
              {i === 0 && (
                <span className="mb-2 w-fit rounded-md bg-magenta px-2.5 py-1 font-display text-[11px] font-semibold tracking-[0.1em] text-white uppercase">
                  {nextUpLabel}
                </span>
              )}
              <h3 className="line-clamp-2 font-display text-lg font-semibold text-ink group-hover:text-indigo">
                <Link
                  href={event.href}
                  className="card-stretch"
                >
                  {event.title}
                </Link>
              </h3>
              {(event.date || event.time) && (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                  {event.date && <EventMeta icon="calendar">{event.date}</EventMeta>}
                  {event.time && <EventMeta icon="clock">{event.time}</EventMeta>}
                </p>
              )}
              {event.repeat && (
                <p className="mt-1 text-sm text-stone">
                  <EventMeta icon="repeat">{event.repeat}</EventMeta>
                </p>
              )}
              <EventMedia
                flyerUrl={event.flyerUrl}
                flyerAlt={event.flyerAlt}
                description={event.description}
                index={i}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
                className="mt-3 grow"
              />
              <div className="mt-3.5 flex flex-col">
                {event.location && (
                  <p className="text-sm text-ink-soft">
                    <EventMeta icon="pin">{event.location}</EventMeta>
                  </p>
                )}
                {/* min-h aligns "Details" across cards with and without sign-up. */}
                <div className="mt-auto flex min-h-9 flex-wrap items-center justify-between gap-3 pt-3">
                  <span className="font-display text-sm font-semibold text-indigo">
                    {detailsLabel}
                  </span>
                  {event.signupUrl && (
                    <EventSignupLink
                      href={event.signupUrl}
                      label={signupLabel}
                      title={event.title}
                      ariaTemplate={signupAriaLabel}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
