"use client";

import { useState } from "react";
import { SitePhoto, type SitePhotoSource } from "@/components/site-photo";

export type SchoolLevel = {
  name: string;
  nameJa: string;
  summary: string;
  /** Empty unless the class is on hold — then the notice to show. */
  status: string;
  description: string;
  points: string[];
  photo?: SitePhotoSource;
};

export function SchoolLevels({
  levels,
  tablistLabel,
  photoLabel,
}: {
  levels: SchoolLevel[];
  tablistLabel: string;
  photoLabel: string;
}) {
  const [active, setActive] = useState(0);
  const level = levels[active];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-14">
      <div
        role="tablist"
        aria-label={tablistLabel}
        aria-orientation="vertical"
        className="flex flex-col lg:col-span-5"
      >
        {levels.map((item, i) => {
          const current = i === active;
          const climbed = i <= active;
          return (
            <button
              key={item.name}
              type="button"
              role="tab"
              id={`school-level-tab-${i}`}
              aria-selected={current}
              aria-controls="school-level-panel"
              onClick={() => setActive(i)}
              className={`group flex items-stretch gap-4 rounded-lg pr-4 text-left transition-colors ${
                current ? "bg-white shadow-md" : "hover:bg-white/70"
              }`}
            >
              <span aria-hidden="true" className="relative flex w-8 shrink-0 justify-center">
                <span
                  className={`absolute inset-y-0 w-1 transition-colors duration-500 group-first:top-1/2 group-last:bottom-1/2 ${
                    climbed ? "bg-gold" : "bg-line"
                  }`}
                />
                <span
                  className={`relative mt-6 size-4 rounded-full border-2 transition duration-300 ${
                    current
                      ? "scale-125 border-magenta bg-magenta"
                      : climbed
                        ? "border-gold bg-gold"
                        : "border-line bg-white group-hover:border-indigo"
                  }`}
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1 py-4">
                <span
                  className={`font-display text-lg leading-snug font-semibold ${
                    current ? "text-indigo-deep" : item.status ? "text-ink-soft" : "text-ink"
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-base leading-snug text-ink-soft">
                  {item.status || item.summary}
                </span>
              </span>
              <span
                lang="ja"
                aria-hidden="true"
                className={`self-center font-accent text-2xl font-bold transition-colors ${
                  current ? "text-magenta" : "text-indigo"
                }`}
              >
                {item.nameJa}
              </span>
            </button>
          );
        })}
      </div>

      {/* Keyed on the choice so a new level fades in rather than snapping. */}
      <div
        key={active}
        role="tabpanel"
        id="school-level-panel"
        aria-labelledby={`school-level-tab-${active}`}
        className="enter-fade lg:col-span-7"
      >
        <div className="relative">
          <SitePhoto
            photo={level.photo}
            sizes="(max-width: 1024px) 100vw, 52rem"
            placeholderLabel={photoLabel}
            className="aspect-photo w-full rounded-sm shadow-xl"
          />
          <p
            lang="ja"
            aria-hidden="true"
            className="school-plaque absolute -top-4 right-4 font-accent text-xl font-bold tracking-[0.2em] sm:right-6 sm:text-2xl"
          >
            {level.nameJa}
          </p>
        </div>
        <h3 className="mt-7 font-display text-3xl leading-tight font-normal text-ink sm:text-4xl">
          {level.name}
        </h3>
        {level.status && (
          <p className="mt-4 w-fit rounded-xs bg-magenta px-4 py-2 font-display text-base font-semibold text-white">
            {level.status}
          </p>
        )}
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{level.description}</p>
        <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {level.points.map((point) => (
            <li key={point} className="flex items-baseline gap-3 text-lg text-ink">
              <span aria-hidden="true" className="size-2 shrink-0 rotate-45 bg-gold" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
