"use client";

import { useRef } from "react";
import Image from "next/image";
import { useMountedAround, useRotation } from "@/components/carousel-hooks";
import { CarouselDots } from "@/components/carousel-dots";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";

export type SchoolSlide = {
  src: string;
  alt: string;
  label: string;
  caption: string;
};

export function SchoolSlideshow({
  slides,
  sizes,
  labels,
  className = "",
}: {
  slides: SchoolSlide[];
  sizes: string;
  labels: { region: string; pause: string; play: string; show: string };
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rotation = useRotation({ count: slides.length, viewRef: stageRef });
  const { active } = rotation;
  const mounted = useMountedAround(active, slides.length);
  const slide = slides[active];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      {...rotation.focusProps}
      className={`byobu-frame ${className}`}
    >
      <div
        ref={stageRef}
        className="relative aspect-card overflow-clip bg-ink-deep sm:aspect-photo"
      >
        {slides.map((item, i) =>
          mounted.includes(i) ? (
            <div
              key={item.src}
              aria-hidden={i !== active}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === active ? 1 : 0 }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={sizes}
                className={`object-cover ${i === active ? "hero-drift" : ""}`}
              />
            </div>
          ) : null,
        )}

        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink-deep/55 to-transparent" />
        <div className="absolute inset-x-2 top-1 z-10 sm:inset-x-4">
          <CarouselDots
            count={slides.length}
            active={active}
            rotation={rotation}
            intervalClassName="school-progress"
            onShow={rotation.show}
            itemAriaLabel={(i) => labels.show.replace("{label}", slides[i].label)}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink-deep via-ink-deep/75 to-transparent px-4 pt-16 pb-4 sm:px-6 sm:pb-5">
          <p key={active} className="enter-fade min-w-0 text-white">
            <span className="block font-display text-3xl leading-none font-semibold tracking-[0.04em] sm:text-4xl">
              {slide.label}
            </span>
            <span className="mt-1.5 block text-base leading-snug text-white/90 sm:text-lg">
              {slide.caption}
            </span>
          </p>
          {rotation.canRotate && (
            <CarouselPlayToggle
              stopped={rotation.stopped}
              onToggle={rotation.toggle}
              pauseLabel={labels.pause}
              playLabel={labels.play}
              className="h-11 w-11 border-white/50 bg-ink-deep/40 text-white hover:bg-white hover:text-ink-deep"
            />
          )}
        </div>
      </div>
    </div>
  );
}
