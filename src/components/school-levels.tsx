"use client";

import { useState } from "react";
import { PhotoPlaceholder } from "@/components/photo-placeholder";

export type SchoolLevel = {
  name: string;
  nameJa: string;
  summary: string;
  /** Empty unless the class is on hold — then the notice to show. */
  status: string;
  description: string;
  points: string[];
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
    <div className="grid gap-5 lg:grid-cols-[19rem_1fr] lg:items-start lg:gap-7">
      <div
        role="tablist"
        aria-label={tablistLabel}
        aria-orientation="vertical"
        className="flex flex-col gap-2"
      >
        {levels.map((item, i) => {
          const current = i === active;
          return (
            <button
              key={item.name}
              type="button"
              role="tab"
              id={`school-level-tab-${i}`}
              aria-selected={current}
              aria-controls="school-level-panel"
              onClick={() => setActive(i)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                current
                  ? "border-navy bg-navy"
                  : "border-line bg-white hover:border-indigo"
              }`}
            >
              <span className="flex flex-col gap-0.5">
                <span
                  className={`font-display text-base font-semibold ${
                    current ? "text-white" : item.status ? "text-ink-soft" : "text-ink"
                  }`}
                >
                  {item.name}
                </span>
                <span
                  className={`font-display text-xs tracking-[0.06em] ${
                    current ? "text-sky" : "text-stone"
                  }`}
                >
                  {item.status || item.summary}
                </span>
              </span>
              <span
                lang="ja"
                aria-hidden="true"
                className={`shrink-0 font-accent text-lg font-bold ${
                  current ? "text-sky" : "text-indigo"
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
        id="school-level-panel"
        aria-labelledby={`school-level-tab-${active}`}
        className="surface-card overflow-clip"
      >
        <PhotoPlaceholder
          label={photoLabel}
          frame={false}
          className="h-48 w-full border-b border-line sm:h-64"
        />
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
            <h3 className="font-display text-2xl font-semibold text-ink">{level.name}</h3>
            <span lang="ja" className="font-accent text-lg font-bold tracking-[0.14em] text-indigo">
              {level.nameJa}
            </span>
          </div>
          {level.status && (
            <p className="mt-3 rounded-lg border border-magenta/30 bg-cream px-4 py-2.5 font-display text-sm font-semibold text-magenta">
              {level.status}
            </p>
          )}
          <p className="mt-3 leading-relaxed text-ink-soft">{level.description}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {level.points.map((point) => (
              <li
                key={point}
                className="rounded-full border border-line bg-mist px-3 py-1.5 font-display text-xs font-semibold text-ink"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
