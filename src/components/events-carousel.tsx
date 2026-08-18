"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export type CarouselEvent = {
  id: string;
  href: string;
  title: string;
  date: string | null;
  time: string | null;
  location: string | null;
  description: string | null;
  flyerUrl: string | null;
  flyerAlt: string;
};

export function EventsCarousel({
  events,
  nextUpLabel,
  prevLabel,
  nextLabel,
  detailsLabel,
}: {
  events: CarouselEvent[];
  nextUpLabel: string;
  prevLabel: string;
  nextLabel: string;
  detailsLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const amount = (card?.offsetWidth ?? 340) + 22;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {events.length > 1 && (
        <div className="mb-4 flex justify-end gap-2 sm:hidden">
          <button
            type="button"
            aria-label={prevLabel}
            onClick={() => scrollByCard(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-indigo"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => scrollByCard(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-indigo"
          >
            ›
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
              className="absolute top-1/2 -left-5 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-xl text-indigo shadow-lg hover:bg-indigo hover:text-white sm:flex lg:-left-6"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={nextLabel}
              onClick={() => scrollByCard(1)}
              className="absolute top-1/2 -right-5 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-xl text-indigo shadow-lg hover:bg-indigo hover:text-white sm:flex lg:-right-6"
            >
              ›
            </button>
          </>
        )}
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4"
        >
          {events.map((event, i) => (
            <Link
              key={event.id}
              data-card
              href={event.href}
              className={`group flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-xl bg-white p-3.5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:w-80 ${
                i === 0 ? "border-2 border-indigo" : "border border-line"
              }`}
            >
              {i === 0 && (
                <span className="mb-2 inline-block w-fit rounded-md bg-magenta px-2.5 py-1 font-display text-[11px] font-semibold tracking-[0.1em] text-white uppercase">
                  {nextUpLabel}
                </span>
              )}
              <div className="relative aspect-flyer w-full overflow-hidden rounded-lg bg-mist p-1.5">
                {event.flyerUrl ? (
                  <Image
                    src={event.flyerUrl}
                    alt={event.flyerAlt}
                    fill
                    sizes="(max-width: 640px) 300px, 340px"
                    className="object-contain"
                  />
                ) : (
                  <Image
                    src="/logo-mark.png"
                    alt=""
                    width={56}
                    height={56}
                    className="absolute inset-0 m-auto opacity-10"
                  />
                )}
              </div>
              <div className="mt-3.5 flex flex-1 flex-col">
                <h3 className="font-display text-lg font-semibold text-ink group-hover:text-indigo">
                  {event.title}
                </h3>
                {event.date && (
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {event.date}
                    {event.time ? ` · ${event.time}` : ""}
                    {event.location ? <br /> : null}
                    {event.location}
                  </p>
                )}
                {event.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {event.description}
                  </p>
                )}
                <span className="mt-auto pt-3 font-display text-sm font-semibold text-indigo">
                  {detailsLabel} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
