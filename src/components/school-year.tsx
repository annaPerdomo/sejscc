"use client";

import { useEffect, useRef, useState, type AnimationEvent, type PointerEvent } from "react";
import Image from "next/image";
import {
  useInView,
  useMountedAround,
  useReducedMotion,
} from "@/components/carousel-hooks";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import type { SchoolEvent, SeasonId } from "@/lib/school-year";

// Fills and rules only: on navy, gold and sand are not text colors.
const SEASON_BARS: Record<SeasonId, { track: string; fill: string }> = {
  spring: { track: "bg-blossom/30", fill: "bg-blossom" },
  summer: { track: "bg-sky/30", fill: "bg-sky" },
  autumn: { track: "bg-gold/40", fill: "bg-gold" },
  winter: { track: "bg-sand/30", fill: "bg-sand" },
};

export function SchoolYear({
  events,
  currentIndex,
  labels,
}: {
  events: SchoolEvent[];
  currentIndex: number;
  labels: { list: string; current: string; pause: string; play: string };
}) {
  const [active, setActive] = useState(currentIndex);
  const [cycle, setCycle] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, 0.5);
  const reduceMotion = useReducedMotion();
  const mounted = useMountedAround(active, events.length);

  const canRotate = !reduceMotion && events.length > 1;
  const rotating = canRotate && !stopped;
  const paused = hoverPaused || focusPaused || !inView;

  useEffect(() => {
    const strip = stripRef.current;
    const tab = strip?.querySelectorAll<HTMLElement>("[role=tab]")[active];
    if (!strip || !tab || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({
      left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [active, reduceMotion]);

  if (events.length === 0) return null;

  const advance = (e: AnimationEvent<HTMLSpanElement>) => {
    if (e.animationName !== "tab-progress") return;
    setActive((active + 1) % events.length);
    setCycle((c) => c + 1);
  };

  const show = (index: number) => {
    setActive(index);
    setStopped(true);
    setCycle((c) => c + 1);
  };

  // A touch never fires mouseleave, so a swipe holds rotation until Play;
  // otherwise the next advance would scroll the strip back mid-swipe.
  const holdForSwipe = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") setHoverPaused(true);
  };

  // Play clears the hover and focus holds too: the pointer is still inside,
  // and no mouseleave is coming to release them.
  const toggle = () => {
    if (stopped) {
      setHoverPaused(false);
      setFocusPaused(false);
    }
    setStopped(!stopped);
  };

  return (
    <div
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
      className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-x-12 lg:gap-y-8"
    >
      <div className="asanoha-frame lg:col-span-6 lg:self-stretch">
        <div
          ref={stageRef}
          className="relative aspect-photo w-full overflow-clip rounded-xs bg-ink-deep ring-1 ring-gold/40 lg:aspect-auto lg:h-full lg:min-h-year-photo"
        >
          {events.map((item, i) =>
            mounted.includes(i) ? (
              <div
                key={item.id}
                aria-hidden={i !== active}
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: i === active ? 1 : 0 }}
              >
                <Image
                  src={item.photo.src}
                  alt={item.photo.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 48rem"
                  className="object-cover"
                />
              </div>
            ) : null
          )}
          {canRotate && (
            <CarouselPlayToggle
              stopped={stopped}
              onToggle={toggle}
              pauseLabel={labels.pause}
              playLabel={labels.play}
              className="absolute right-3 bottom-3 z-10 h-11 w-11 border-white/50 bg-ink-deep/50 text-white hover:bg-white hover:text-ink-deep"
            />
          )}
        </div>
      </div>

      {/* Every write-up shares one cell, so the row is always as tall as the
          longest and the timeline below doesn't jump as they rotate. */}
      <div className="order-last grid lg:order-none lg:col-span-6">
        {events.map((item, i) => (
          <div
            key={item.id}
            id={`school-year-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`school-year-tab-${item.id}`}
            inert={i !== active}
            className={`col-start-1 row-start-1 ${i === active ? "enter-fade" : "invisible"}`}
          >
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-sm font-semibold tracking-[0.2em] text-sky uppercase">
              {i === currentIndex && (
                <span className="rounded-full bg-blossom px-3 py-1 text-xs tracking-widest text-ink-deep">
                  {labels.current}
                </span>
              )}
              {item.when}
            </p>
            <h3 className="mt-3 font-display text-3xl leading-tight font-normal text-white sm:text-4xl">
              {item.title}
            </h3>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
              {item.termJa !== item.title && (
                <span lang="ja" className="font-accent text-2xl font-bold text-white">
                  {item.termJa}
                </span>
              )}
              <span className="font-display text-lg text-sky">{item.gloss}</span>
            </p>
            <div aria-hidden="true" className="mt-5 h-px w-16 bg-gold" />
            <p className="mt-5 text-lg leading-relaxed text-white/85">{item.description}</p>
          </div>
        ))}
      </div>

      <div
        ref={stripRef}
        role="tablist"
        aria-label={labels.list}
        onPointerDown={holdForSwipe}
        className="relative -mx-5 flex gap-3 overflow-x-auto px-5 pt-2 pb-2 sm:-mx-10 sm:px-10 lg:col-span-12 lg:mx-0 lg:overflow-visible lg:px-0 lg:pt-0 lg:pb-0"
      >
        {events.map((item, i) => {
          const selected = i === active;
          const bar = SEASON_BARS[item.season.id];
          const seasonStart = events[i - 1]?.season.id !== item.season.id;
          return (
            <button
              key={item.id}
              id={`school-year-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`school-year-panel-${item.id}`}
              onClick={() => show(i)}
              className="group flex w-32 shrink-0 flex-col items-start rounded-xs pt-1 pb-2 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky lg:w-auto lg:min-w-0 lg:flex-1"
            >
              <span className="flex h-7 items-baseline gap-2">
                {seasonStart && (
                  <>
                    <span lang="ja" className="font-accent text-xl leading-none font-bold text-white">
                      {item.season.kanji}
                    </span>
                    {!item.season.name.includes(item.season.kanji) && (
                      <span className="font-display text-xs font-semibold tracking-[0.2em] text-sky uppercase">
                        {item.season.name}
                      </span>
                    )}
                  </>
                )}
              </span>
              <span className={`mt-2 block h-1 w-full overflow-clip rounded-xs ${bar.track}`}>
                {selected && (
                  <span
                    key={cycle}
                    onAnimationEnd={advance}
                    className={`block h-full ${bar.fill} ${rotating ? "tab-progress year-progress" : ""} ${
                      rotating && paused ? "tab-progress-paused" : ""
                    }`}
                  />
                )}
              </span>
              <span className="mt-3 flex items-center gap-2 font-display text-sm font-semibold tracking-widest text-sky uppercase">
                {item.abbr}
                {i === currentIndex && (
                  <>
                    <span aria-hidden="true" className="size-2 rounded-full bg-blossom" />
                    <span className="sr-only">{labels.current}</span>
                  </>
                )}
              </span>
              <span
                className={`mt-1 text-base leading-snug transition-colors ${
                  selected ? "font-semibold text-white" : "text-white/70 group-hover:text-white"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
