"use client";

import Image from "next/image";
import { useRef, useState, type AnimationEvent, type ReactNode } from "react";
import {
  useInView,
  useMountedAround,
  useReducedMotion,
} from "@/components/carousel-hooks";
import { BrushEdge } from "@/components/brush-edge";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import { SectionKicker } from "@/components/section-kicker";

export type ReelPhoto = {
  src: string;
  year: string;
  title: string;
  alt: string;
};

type Labels = {
  accent: string;
  caption: string;
  title: string;
  list: string;
  pause: string;
  play: string;
};

const KANJI_DIGITS = "〇一二三四五六七八九";

function kanjiYear(year: string) {
  return `${[...year].map((digit) => KANJI_DIGITS[Number(digit)] ?? digit).join("")}年`;
}

// The wash behind the copy is near-solid paper, so `ink-soft` holds AA over
// even the brightest photo; thinning its first stop puts the copy at risk.
export function EventsReel({
  photos,
  labels,
  children,
  aside,
  settlesIntoAzure,
}: {
  photos: ReelPhoto[];
  labels: Labels;
  children: ReactNode;
  aside?: ReactNode;
  /** Without the azure list below, the paper calendars continue this surface. */
  settlesIntoAzure: boolean;
}) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef);
  const reduceMotion = useReducedMotion();
  const mounted = useMountedAround(active, photos.length);

  const canRotate = photos.length > 1 && !reduceMotion;
  const rotating = canRotate && !stopped;
  const paused = hoverPaused || focusPaused || !inView;
  const current = photos[active];

  const goTo = (index: number) => {
    setPrevious(active);
    setActive(index);
    setCycle((c) => c + 1);
  };

  const advance = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.animationName !== "tab-progress") return;
    goTo((active + 1) % photos.length);
  };

  const show = (index: number) => {
    if (index !== active) goTo(index);
    setStopped(true);
  };

  // Play clears the hover and focus holds too: the pointer is still inside,
  // and no mouseleave is coming to release them.
  const toggleRotation = () => {
    if (stopped) {
      setHoverPaused(false);
      setFocusPaused(false);
    }
    setStopped(!stopped);
  };

  if (!current) return null;

  return (
    <section
      ref={sectionRef}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
      className="edge-flush relative isolate overflow-clip bg-paper"
    >
      <div className="relative -z-10 h-64 overflow-clip sm:h-96 lg:absolute lg:inset-0 lg:h-auto">
        {photos.map((photo, i) =>
          mounted.includes(i) ? (
            <div
              key={photo.src}
              aria-hidden={i !== active}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                preload={i === 0}
                sizes="100vw"
                className={`object-cover ${
                  i === active || i === previous ? "reel-zoom" : ""
                } ${i === active && (paused || stopped) ? "reel-zoom-paused" : ""}`}
              />
            </div>
          ) : null,
        )}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent lg:hidden"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-r from-paper from-30% via-paper/90 via-48% to-paper/0 to-72% lg:block"
        />
      </div>

      <div className="mx-auto grid max-w-wide gap-10 px-5 pb-16 sm:px-10 sm:pb-20 lg:grid-cols-12 lg:items-center lg:gap-x-14 lg:gap-y-6 lg:px-16 lg:pt-12 lg:pb-20">
        <div className="enter-stagger lg:col-span-6 lg:row-span-2 lg:row-start-1 xl:col-span-5">
          <SectionKicker
            accent={labels.accent}
            caption={labels.caption}
            tone="tinted"
            size="lg"
            entrance="load"
          />
          <h1 className="mt-4 font-display text-5xl leading-none font-light tracking-[0.01em] text-ink sm:text-6xl">
            {labels.title}
          </h1>
          <div className="mt-8">{children}</div>
        </div>

        {aside && (
          <div className="enter-rise flex justify-center lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:self-end">
            {aside}
          </div>
        )}

        <div className="order-first -mt-12 sm:-mt-16 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:mt-0 lg:self-start">
          <div className="enter-fade rounded-sm bg-ink-deep/85 px-5 pt-4 pb-1 text-white shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <p key={active} className="enter-rise min-w-0">
                <span className="font-display text-2xl font-light tracking-[0.04em]">
                  {current.year}
                </span>
                <span aria-hidden="true" className="ml-3 font-accent text-sm tracking-[0.2em] text-sand">
                  {kanjiYear(current.year)}
                </span>
                <span className="mt-0.5 block text-base leading-snug">{current.title}</span>
              </p>
              {canRotate && (
                <CarouselPlayToggle
                  stopped={stopped}
                  onToggle={toggleRotation}
                  pauseLabel={labels.pause}
                  playLabel={labels.play}
                  className="h-11 w-11 border-white/60 bg-transparent text-white hover:bg-white hover:text-navy"
                />
              )}
            </div>
            <div
              role="group"
              aria-label={labels.list}
              className="mt-3 grid grid-flow-col auto-cols-fr border-t border-white/20"
            >
              {photos.map((photo, i) => (
                <button
                  key={photo.src}
                  type="button"
                  aria-current={i === active}
                  aria-label={`${photo.year}: ${photo.title}`}
                  onClick={() => show(i)}
                  className={`relative -mt-px py-3 font-display text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-sky ${
                    i === active ? "text-white" : "text-white/75 hover:text-white"
                  }`}
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 overflow-clip">
                    {i === active && (
                      <span
                        key={cycle}
                        onAnimationEnd={advance}
                        className={`block h-full bg-sky ${
                          rotating ? "tab-progress reel-progress" : ""
                        } ${rotating && paused ? "tab-progress-paused" : ""}`}
                      />
                    )}
                  </span>
                  {photo.year}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {settlesIntoAzure && (
        <BrushEdge
          id="events-reel"
          variant="paper"
          settlesInto="azure"
          className="absolute inset-x-0 bottom-0"
        />
      )}
    </section>
  );
}
