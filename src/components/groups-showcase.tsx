"use client";

import { useRef, useState, type AnimationEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useInView,
  useMountedAround,
  useReducedMotion,
} from "@/components/carousel-hooks";
import { CarouselDots } from "@/components/carousel-dots";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import { EventMeta } from "@/components/event-meta";
import { ExternalLink } from "@/components/external-link";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";

export type GroupsShowcaseItem = {
  id: string;
  name: string;
  websiteUrl: string | null;
  schedule: string | null;
  description: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  photoUrls: string[];
};

type Labels = {
  kickerAccent: string;
  kickerCaption: string;
  headingLine1: string;
  headingLine2: string;
  body: string;
  cta: string;
  list: string;
  website: string;
  pause: string;
  play: string;
  photo: string;
  photoAlt: string;
};

const OPEN_PHOTO_SIZES = "(max-width: 1024px) 100vw, 60vw";
const LOGO_SIZES = "4rem";

function slideCount(item: GroupsShowcaseItem) {
  return Math.max(item.photoUrls.length, 1);
}

function Slideshow({
  item,
  slide,
  altTemplate,
}: {
  item: GroupsShowcaseItem;
  slide: number;
  altTemplate: string;
}) {
  const mounted = useMountedAround(slide, item.photoUrls.length);

  if (item.photoUrls.length === 0) {
    return (
      <div className="absolute inset-0 bg-navy">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes={OPEN_PHOTO_SIZES}
            className="object-contain p-12"
          />
        )}
      </div>
    );
  }

  return item.photoUrls.map((src, i) =>
    mounted.includes(i) ? (
      <div
        key={src}
        aria-hidden={i !== slide}
        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{ opacity: i === slide ? 1 : 0 }}
      >
        <Image
          src={src}
          alt={altTemplate
            .replace("{name}", item.name)
            .replace("{n}", String(i + 1))
            .replace("{total}", String(item.photoUrls.length))}
          fill
          sizes={OPEN_PHOTO_SIZES}
          className={`object-cover ${i === slide ? "hero-drift" : ""}`}
        />
      </div>
    ) : null,
  );
}

export function GroupsShowcase({
  items,
  ctaHref,
  labels,
}: {
  items: GroupsShowcaseItem[];
  ctaHref: string;
  labels: Labels;
}) {
  const [active, setActive] = useState(0);
  const [slide, setSlide] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, 0.6);
  const reduceMotion = useReducedMotion();

  const canRotate =
    !reduceMotion && (items.length > 1 || slideCount(items[0]) > 1);
  const rotating = canRotate && !stopped;
  const paused = hoverPaused || focusPaused || !inView;

  const advance = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.animationName !== "tab-progress") return;
    if (slide + 1 < slideCount(items[active])) {
      setSlide(slide + 1);
    } else {
      setSlide(0);
      if (!pinned) setActive((active + 1) % items.length);
    }
    setCycle((c) => c + 1);
  };

  const show = (group: number, photo: number) => {
    setActive(group);
    setSlide(photo);
    setPinned(true);
    setCycle((c) => c + 1);
  };

  // Play clears the hover and focus holds too: the pointer is still inside,
  // and no mouseleave is coming to release them.
  const toggle = () => {
    if (stopped) {
      setHoverPaused(false);
      setFocusPaused(false);
      setPinned(false);
    }
    setStopped(!stopped);
  };

  return (
    <div
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
    >
      <div className="reveal-rise mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div>
          <SectionKicker
            accent={labels.kickerAccent}
            caption={labels.kickerCaption}
            size="lg"
          />
          <SectionHeading className="mt-3">
            <span className="text-indigo">{labels.headingLine1}</span>{" "}
            {labels.headingLine2}
          </SectionHeading>
        </div>
        <div className="flex items-end justify-between gap-5 lg:justify-end">
          <div className="max-w-xl lg:text-right">
            <p className="text-lg text-ink-soft">{labels.body}</p>
            <Link
              href={ctaHref}
              className="link-arrow mt-3 inline-block font-display text-base font-semibold text-indigo hover:text-indigo-deep"
            >
              {labels.cta}
            </Link>
          </div>
          {canRotate && (
            <CarouselPlayToggle
              stopped={stopped}
              onToggle={toggle}
              pauseLabel={labels.pause}
              playLabel={labels.play}
              className="h-11 w-11 shrink-0 border-navy/40 bg-transparent text-navy hover:bg-navy hover:text-white"
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="asanoha-frame lg:col-span-7">
          <div
            ref={stageRef}
            className="relative aspect-square overflow-clip rounded-xs bg-navy ring-1 ring-gold/40 sm:aspect-photo lg:aspect-auto lg:h-full lg:min-h-144"
          >
            {items.map((item, i) => {
              const isOpen = i === active;
              return (
                <div
                  key={item.id}
                  id={`group-stage-${item.id}`}
                  role="tabpanel"
                  aria-labelledby={`group-tab-${item.id}`}
                  inert={!isOpen}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: isOpen ? 1 : 0 }}
                >
                  {isOpen && (
                    <>
                      <Slideshow
                        item={item}
                        slide={slide}
                        altTemplate={labels.photoAlt}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-deep from-5% via-ink-deep/55 via-40% to-transparent to-70%" />
                      {slideCount(item) > 1 && (
                        <>
                          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-deep/50 to-transparent" />
                          <div className="absolute inset-x-3 top-2 z-20 sm:inset-x-5 lg:inset-x-7">
                            <CarouselDots
                              count={slideCount(item)}
                              active={slide}
                              cycle={cycle}
                              rotating={rotating}
                              paused={paused}
                              progressClassName={`groups-progress groups-progress-${slideCount(item)}`}
                              tone="sky"
                              onShow={(n) => show(i, n)}
                              onAdvance={advance}
                              itemAriaLabel={(n) =>
                                labels.photo
                                  .replace("{n}", String(n + 1))
                                  .replace("{total}", String(slideCount(item)))
                              }
                            />
                          </div>
                        </>
                      )}
                      {slideCount(item) === 1 && rotating && (
                        <span
                          key={cycle}
                          aria-hidden="true"
                          onAnimationEnd={advance}
                          className={`tab-progress groups-progress invisible absolute ${
                            paused ? "tab-progress-paused" : ""
                          }`}
                        />
                      )}
                      <div className="enter-stagger absolute inset-x-0 bottom-0 z-10 p-5 text-white sm:p-7 lg:p-9">
                        <div className="flex items-center gap-4">
                          {item.logoUrl && (
                            <span className="relative block size-14 shrink-0 sm:size-16">
                              <Image
                                src={item.logoUrl}
                                alt=""
                                fill
                                sizes={LOGO_SIZES}
                                className="object-contain"
                              />
                            </span>
                          )}
                          <h3 className="font-display text-2xl leading-tight font-semibold text-pretty sm:text-3xl lg:text-4xl">
                            {item.name}
                          </h3>
                        </div>
                        {item.schedule && (
                          <p className="mt-4 text-base text-white/90 sm:text-lg">
                            <EventMeta icon="repeat">{item.schedule}</EventMeta>
                          </p>
                        )}
                        {item.description && (
                          <p className="mt-3 line-clamp-2 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                            {item.description}
                          </p>
                        )}
                        {item.websiteUrl && (
                          <p className="mt-5">
                            <ExternalLink
                              href={item.websiteUrl}
                              className="button-light inline-block px-6 py-3 text-sm sm:text-base"
                            >
                              {labels.website}
                            </ExternalLink>
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          role="tablist"
          aria-label={labels.list}
          aria-orientation="vertical"
          className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:grid-cols-2"
        >
          {items.map((item, i) => {
            const isOpen = i === active;
            const cover = item.photoUrls[0] ?? item.imageUrl;
            return (
              <div key={item.id} role="none" className="relative isolate">
                {isOpen && (
                  <span
                    aria-hidden="true"
                    className="asanoha-frame absolute -inset-2"
                  />
                )}
                <button
                  id={`group-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isOpen}
                  aria-controls={`group-stage-${item.id}`}
                  onClick={() => show(i, 0)}
                  className="surface-card surface-card-link relative flex h-full w-full min-w-0 items-center gap-3 overflow-clip rounded-sm p-2 pr-4 text-left"
                >
                  <span className="relative block aspect-card w-24 shrink-0 overflow-clip rounded-xs bg-mist">
                    {cover && (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="6rem"
                        className={
                          item.photoUrls.length > 0
                            ? "object-cover"
                            : "object-contain p-1.5"
                        }
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block font-display text-lg leading-snug font-semibold ${
                        isOpen ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.schedule && (
                      <span className="mt-0.5 block truncate text-sm text-ink-soft">
                        {item.schedule}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
