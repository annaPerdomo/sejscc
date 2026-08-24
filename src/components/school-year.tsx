"use client";

import { useEffect, useState } from "react";
import { SitePhoto, type SitePhotoSource } from "@/components/site-photo";

const ROTATE_MS = 5200;

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
  photoLabel,
}: {
  months: SchoolMonth[];
  tablistLabel: string;
  photoLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [chosen, setChosen] = useState(false);
  const month = months[active];

  useEffect(() => {
    if (hovering || chosen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % months.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [hovering, chosen, months.length]);

  if (!month) return null;

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div
        role="tablist"
        aria-label={tablistLabel}
        className="grid grid-cols-4 border-t border-white/20 sm:grid-cols-6 lg:grid-cols-11"
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
                setChosen(true);
              }}
              className={`-mt-px flex flex-col items-center gap-0.5 border-t-2 px-1 pt-3 pb-2 ${
                current ? "border-sky" : "border-transparent hover:border-white/50"
              }`}
            >
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

      <div
        role="tabpanel"
        id="school-month-panel"
        aria-labelledby={`school-month-tab-${active}`}
        className="mt-9 grid gap-8 lg:grid-cols-[1fr_32rem] lg:items-center lg:gap-12"
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
