import Image, { type StaticImageData } from "next/image";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import type { ReactNode } from "react";

export type Milestone = {
  year: string;
  text: string;
  photo?: { image: StaticImageData; alt: string };
};

export function HistoryTimeline({
  milestones,
  photoLabel,
  children,
}: {
  milestones: Milestone[];
  photoLabel: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="reveal-rise mx-auto max-w-2xl text-center">{children}</div>

      <ol className="mt-14 lg:mt-20">
        {milestones.map((milestone, i) => {
          const photoOnTheRight = i % 2 === 1;
          const photoSide = photoOnTheRight
            ? "reveal-swing-right lg:col-start-2 lg:row-start-1 lg:mr-auto"
            : "reveal-swing-left lg:col-start-1 lg:row-start-1 lg:ml-auto";
          return (
            <li
              key={milestone.year}
              className="reveal-rise relative pb-12 pl-9 last:pb-0 lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-12 lg:pl-0"
            >
              {/* The dot moves from beside the year to the middle of the row
                  at lg, so the rail is drawn a segment at a time. */}
              <span
                aria-hidden="true"
                className={`reveal-rail absolute left-1.5 w-px bg-blossom/70 lg:left-1/2 ${
                  i === 0 ? "top-2.5 lg:top-1/2" : "top-0"
                } ${
                  i === milestones.length - 1
                    ? "h-2.5 lg:h-auto lg:bottom-1/2"
                    : "bottom-0"
                }`}
              />
              <span
                aria-hidden="true"
                className="reveal-pop absolute top-2.5 left-1.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-magenta ring-4 ring-magenta/15 lg:top-1/2 lg:left-1/2 lg:-translate-y-1/2"
              />
              <div
                className={
                  photoOnTheRight
                    ? "lg:col-start-1 lg:row-start-1 lg:text-right"
                    : "lg:col-start-2 lg:row-start-1"
                }
              >
                <p className="font-display text-2xl font-bold tracking-[0.05em] text-magenta">
                  {milestone.year}
                </p>
                <p className="mt-3 leading-relaxed text-ink-soft">{milestone.text}</p>
              </div>
              {/* The scans run from a 5:1 panorama to a small portrait, so each
                  renders at its intrinsic size — a shared frame would crop or
                  upscale them past legibility. */}
              {milestone.photo ? (
                <div
                  className={`mt-6 w-fit bg-paper p-2 shadow-lg lg:mt-0 ${photoSide}`}
                >
                  <div className="overflow-clip border border-line">
                    <Image
                      src={milestone.photo.image}
                      alt={milestone.photo.alt}
                      sizes="(max-width: 1024px) calc(100vw - 5.25rem), 37rem"
                      placeholder="blur"
                      className={photoOnTheRight ? "ken-burns-out" : "ken-burns-in"}
                    />
                  </div>
                </div>
              ) : (
                <PhotoPlaceholder
                  label={photoLabel}
                  className={`mt-6 aspect-band w-full bg-paper p-2 shadow-lg lg:mt-0 ${photoSide}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
