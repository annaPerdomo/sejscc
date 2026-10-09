"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { useMountedAround, useRotation } from "@/components/carousel-hooks";
import { BrushEdge } from "@/components/brush-edge";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import { RotationProgress } from "@/components/rotation-progress";
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
  const sectionRef = useRef<HTMLElement>(null);
  const rotation = useRotation({ count: photos.length, viewRef: sectionRef });
  const { active } = rotation;
  const [shown, setShown] = useState({ active, previous: -1 });
  if (shown.active !== active) setShown({ active, previous: shown.active });
  const { previous } = shown;
  const mounted = useMountedAround(active, photos.length);
  const current = photos[active];

  if (!current) return null;

  return (
    <section
      ref={sectionRef}
      {...rotation.focusProps}
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
                } ${
                  i === active && (rotation.paused || rotation.stopped)
                    ? "reel-zoom-paused"
                    : ""
                }`}
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
              {rotation.canRotate && (
                <CarouselPlayToggle
                  stopped={rotation.stopped}
                  onToggle={rotation.toggle}
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
                  onClick={() => rotation.show(i)}
                  className={`relative -mt-px py-3 font-display text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-sky ${
                    i === active ? "text-white" : "text-white/75 hover:text-white"
                  }`}
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 overflow-clip">
                    {i === active && (
                      <RotationProgress
                        rotation={rotation}
                        intervalClassName="reel-progress"
                        className="block h-full bg-sky"
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
