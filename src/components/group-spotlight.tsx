"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CarouselArrow } from "@/components/carousel-arrow";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import { ExternalLink } from "@/components/external-link";

const ROTATE_MS = 5500;

export type SpotlightGroup = {
  id: string;
  name: string;
  nameJa: string | null;
  description: string | null;
  meetingSchedule: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
};

export function GroupSpotlight({
  groups,
  label,
  websiteLabel,
  prevLabel,
  nextLabel,
  pauseLabel,
  playLabel,
  photoLabel,
  slideLabel,
}: {
  groups: SpotlightGroup[];
  label: string;
  websiteLabel: string;
  prevLabel: string;
  nextLabel: string;
  pauseLabel: string;
  playLabel: string;
  photoLabel: string;
  slideLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  // The directory below already loads every group image; mounting all of them
  // here as well would double the page's image weight on first paint.
  const [mountedImages, setMountedImages] = useState<number[]>(() =>
    groups.length > 1 ? [0, 1] : [0],
  );

  const upcoming = groups.length > 1 ? (active + 1) % groups.length : active;
  if (!mountedImages.includes(active) || !mountedImages.includes(upcoming)) {
    setMountedImages(Array.from(new Set([...mountedImages, active, upcoming])));
  }

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const running =
    !stopped && !hoverPaused && !focusPaused && !reduceMotion && groups.length > 1;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % groups.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [running, groups.length]);

  // Stepping by hand is a deliberate choice, so it stops the rotation outright
  // rather than pausing it invisibly and letting a mouse leave restart it.
  function show(next: number) {
    setActive((next + groups.length) % groups.length);
    setStopped(true);
  }

  return (
    <div
      className="surface-card overflow-clip"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
    >
      <div className="grid" aria-live={running ? "off" : "polite"}>
        {groups.map((group, i) => (
          <div
            key={group.id}
            role="group"
            aria-roledescription="slide"
            aria-label={slideLabel
              .replace("{n}", String(i + 1))
              .replace("{total}", String(groups.length))}
            aria-hidden={i !== active}
            // visibility is in the transition so the outgoing panel fades out
            // rather than cutting to an empty card.
            className={`col-start-1 row-start-1 grid transition-[opacity,visibility] duration-500 ease-in-out sm:grid-cols-[1.15fr_1fr] ${
              i === active ? "" : "invisible opacity-0"
            }`}
          >
            <div className="relative aspect-photo bg-mist sm:aspect-auto sm:min-h-72">
              {group.imageUrl ? (
                mountedImages.includes(i) && (
                  <Image
                    src={group.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 45vw"
                    className="object-contain p-5 sm:p-8"
                  />
                )
              ) : (
                <span className="absolute inset-0 flex items-center justify-center px-6 text-center font-display text-xs font-semibold tracking-[0.14em] text-stone uppercase">
                  {photoLabel}
                </span>
              )}
            </div>
            <div className="flex flex-col justify-center gap-2.5 border-t border-line p-6 sm:border-t-0 sm:border-l sm:p-8">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                  {group.name}
                </h2>
                {group.nameJa && (
                  <span
                    lang="ja"
                    className="font-accent text-base font-bold tracking-[0.16em] text-indigo"
                  >
                    {group.nameJa}
                  </span>
                )}
              </div>
              {group.meetingSchedule && (
                <p className="font-display text-xs font-semibold tracking-[0.1em] text-magenta uppercase">
                  {group.meetingSchedule}
                </p>
              )}
              {group.description && (
                <p className="leading-relaxed text-ink-soft">{group.description}</p>
              )}
              {(group.websiteUrl || group.contactEmail) && (
                <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-2 font-display text-sm font-semibold">
                  {group.websiteUrl && (
                    <ExternalLink
                      href={group.websiteUrl}
                      className="text-indigo hover:text-indigo-deep"
                    >
                      {websiteLabel}
                    </ExternalLink>
                  )}
                  {group.contactEmail && (
                    <a
                      href={`mailto:${group.contactEmail}`}
                      className="break-words text-indigo hover:text-indigo-deep"
                    >
                      {group.contactEmail}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {groups.length > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2">
          {/* Dots plus arrows do not fit a phone, and a 10px dot is under the
              tap-target size — phones get a counter instead. */}
          <p className="font-display text-sm font-semibold text-stone sm:hidden">
            {active + 1} / {groups.length}
          </p>
          <div className="hidden flex-wrap items-center sm:flex">
            {groups.map((group, i) => (
              <button
                key={group.id}
                type="button"
                aria-label={group.name}
                aria-current={i === active}
                onClick={() => show(i)}
                className="flex h-7 w-7 items-center justify-center"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === active ? "bg-indigo" : "bg-stone"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <CarouselPlayToggle
              stopped={stopped}
              onToggle={() => setStopped((value) => !value)}
              pauseLabel={pauseLabel}
              playLabel={playLabel}
            />
            <CarouselArrow
              direction={-1}
              label={prevLabel}
              onClick={() => show(active - 1)}
            />
            <CarouselArrow
              direction={1}
              label={nextLabel}
              onClick={() => show(active + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
