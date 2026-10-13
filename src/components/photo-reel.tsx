"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useMountedAround, useRotation } from "@/components/carousel-hooks";
import { CarouselDots } from "@/components/carousel-dots";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import type { HeroPhoto } from "@/components/photo-hero";

type Labels = {
  pause: string;
  play: string;
  list: string;
  /** Template with `{n}` and `{total}` placeholders. */
  photo: string;
};

export function PhotoReel({
  photos,
  labels,
  className = "",
}: {
  photos: HeroPhoto[];
  labels: Labels;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rotation = useRotation({ count: photos.length, viewRef: rootRef });
  const { active } = rotation;
  const [shown, setShown] = useState({ active, previous: -1 });
  if (shown.active !== active) setShown({ active, previous: shown.active });
  const { previous } = shown;
  const drifting = rotation.paused || rotation.stopped ? "hero-drift hero-drift-paused" : "hero-drift";
  const mounted = useMountedAround(active, photos.length);

  return (
    <div ref={rootRef} {...rotation.focusProps} className={className}>
      <div className="absolute inset-0 overflow-clip mask-b-from-50% xl:mask-b-from-75% xl:mask-l-from-50%">
        {photos.map((photo, i) =>
          mounted.includes(i) ? (
            <div
              key={typeof photo.src === "string" ? photo.src : i}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === active ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={photo.src}
                alt={i === active ? photo.alt : ""}
                fill
                preload={i === 0}
                fetchPriority={i === 0 ? "high" : undefined}
                sizes="(max-width: 1280px) 100vw, 45vw"
                className={`object-cover ${i === active || i === previous ? drifting : ""}`}
              />
            </div>
          ) : null,
        )}
      </div>
      {photos.length > 1 && (
        <div className="absolute inset-x-5 bottom-2 flex items-center gap-4 rounded-sm bg-ink-deep/70 py-1 pr-1 pl-3 backdrop-blur-sm sm:inset-x-10 xl:right-16 xl:bottom-32 xl:left-auto xl:w-96">
          <CarouselDots
            count={photos.length}
            active={active}
            rotation={rotation}
            intervalClassName="photo-hero-progress"
            onShow={rotation.show}
            ariaLabel={labels.list}
            itemAriaLabel={(i) =>
              labels.photo
                .replace("{n}", String(i + 1))
                .replace("{total}", String(photos.length))
            }
            className="flex-1"
          />
          {rotation.canRotate && (
            <CarouselPlayToggle
              stopped={rotation.stopped}
              onToggle={rotation.toggle}
              pauseLabel={labels.pause}
              playLabel={labels.play}
              className="h-10 w-10 shrink-0 border-white/50 bg-transparent text-white hover:bg-white hover:text-navy"
            />
          )}
        </div>
      )}
    </div>
  );
}
