"use client";

import { useRef, useState, type AnimationEvent } from "react";
import Image from "next/image";
import {
  useInView,
  useMountedAround,
  useReducedMotion,
} from "@/components/carousel-hooks";
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
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, 0.5);
  const reduceMotion = useReducedMotion();
  const mounted = useMountedAround(active, slides.length);

  const canRotate = !reduceMotion && slides.length > 1;
  const rotating = canRotate && !stopped;
  const paused = hoverPaused || focusPaused || !inView;
  const slide = slides[active];

  const advance = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.animationName !== "tab-progress") return;
    setActive((active + 1) % slides.length);
    setCycle((c) => c + 1);
  };

  const show = (index: number) => {
    setActive(index);
    setCycle((c) => c + 1);
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
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
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
        <div className="absolute inset-x-2 top-1 z-10 flex gap-1 sm:inset-x-4">
          {slides.map((item, i) => (
            <button
              key={item.src}
              type="button"
              aria-label={labels.show.replace("{label}", item.label)}
              aria-current={i === active}
              onClick={() => show(i)}
              className="group flex-1 rounded-xs py-3 focus-visible:outline-2 focus-visible:outline-sky"
            >
              <span className="block h-1 overflow-clip rounded-xs bg-white/35 transition-colors group-hover:bg-white/60">
                {i <= active && (
                  <span
                    key={i === active ? cycle : undefined}
                    onAnimationEnd={i === active ? advance : undefined}
                    className={`block h-full bg-white ${
                      i === active && rotating
                        ? "tab-progress school-progress"
                        : ""
                    } ${i === active && rotating && paused ? "tab-progress-paused" : ""}`}
                  />
                )}
              </span>
            </button>
          ))}
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
          {canRotate && (
            <CarouselPlayToggle
              stopped={stopped}
              onToggle={toggle}
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
