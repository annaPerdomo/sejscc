"use client";

import { useEffect, useState, type AnimationEvent } from "react";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import { SitePhoto, type SitePhotoSource } from "@/components/site-photo";

export type SchoolMonth = {
  abbr: string;
  nameJa: string;
  termJa: string;
  when: string;
  title: string;
  description: string;
  photo?: SitePhotoSource;
};

export function SchoolYear({
  months,
  tablistLabel,
  pauseLabel,
  playLabel,
  photoLabel,
}: {
  months: SchoolMonth[];
  tablistLabel: string;
  pauseLabel: string;
  playLabel: string;
  photoLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const month = months[active];
  const rotating = !stopped && !reduceMotion;
  const paused = hoverPaused || focusPaused;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const advance = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.animationName !== "tab-progress") return;
    setActive((i) => (i + 1) % months.length);
  };

  // Play clears the hover and focus holds too: the pointer is still inside,
  // and no mouseleave is coming to release them.
  const resume = () => {
    if (stopped) {
      setHoverPaused(false);
      setFocusPaused(false);
    }
    setStopped(!stopped);
  };

  if (!month) return null;

  return (
    <div
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
    >
      <div className="flex items-start gap-3 border-t border-white/20">
        <div
          role="tablist"
          aria-label={tablistLabel}
          className="grid flex-1 grid-cols-4 sm:grid-cols-6 lg:grid-cols-11"
        >
          {months.map((item, i) => {
            const current = i === active;
            return (
              <button
                key={item.abbr}
                type="button"
                role="tab"
                id={`school-month-tab-${i}`}
                aria-selected={current}
                aria-controls="school-month-panel"
                onClick={() => {
                  setActive(i);
                  setStopped(true);
                }}
                className={`relative -mt-px flex flex-col items-center gap-0.5 border-t-2 border-transparent px-1 pt-3 pb-2 transition-colors ${
                  current ? "" : "hover:border-white/50"
                }`}
              >
                {current && (
                  <span
                    aria-hidden="true"
                    onAnimationEnd={advance}
                    className={`absolute inset-x-0 -top-0.5 h-0.5 bg-sky ${
                      rotating ? "tab-progress month-progress" : ""
                    } ${rotating && paused ? "tab-progress-paused" : ""}`}
                  />
                )}
                <span
                  className={`font-display text-sm font-semibold tracking-[0.06em] ${
                    current ? "text-white" : "text-white/75"
                  }`}
                >
                  {item.abbr}
                </span>
                <span
                  lang="ja"
                  aria-hidden="true"
                  className={`font-accent text-[11px] font-bold tracking-[0.1em] ${
                    current ? "text-sky" : "text-white/70"
                  }`}
                >
                  {item.nameJa}
                </span>
              </button>
            );
          })}
        </div>
        {!reduceMotion && (
          <CarouselPlayToggle
            stopped={stopped}
            onToggle={resume}
            pauseLabel={pauseLabel}
            playLabel={playLabel}
            className="mt-3 shrink-0 border-white/40 bg-transparent text-white hover:bg-white hover:text-indigo"
          />
        )}
      </div>

      {/* Keyed on the month so each one fades in rather than snapping. */}
      <div
        key={active}
        role="tabpanel"
        id="school-month-panel"
        aria-labelledby={`school-month-tab-${active}`}
        className="enter-fade mt-9 grid gap-8 lg:grid-cols-[1fr_32rem] lg:items-center lg:gap-12"
      >
        <div className="lg:min-h-64">
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
            <span lang="ja" className="font-accent text-3xl font-bold text-sky">
              {month.termJa}
            </span>
            <span aria-hidden="true" className="h-px w-9 bg-indigo" />
            <span className="font-display text-xs font-semibold tracking-[0.2em] text-sky uppercase">
              {month.when}
            </span>
          </div>
          <h3 className="mt-4 font-display text-2xl leading-snug font-normal tracking-[0.02em] text-white sm:text-3xl">
            {month.title}
          </h3>
          <p className="mt-4 max-w-lg leading-relaxed text-white/75">{month.description}</p>
        </div>
        <SitePhoto
          photo={month.photo}
          dark
          sizes="(max-width: 1024px) 100vw, 32rem"
          placeholderLabel={photoLabel}
          className="h-64 w-full rounded-xl sm:h-72 lg:h-88"
        />
      </div>
    </div>
  );
}
