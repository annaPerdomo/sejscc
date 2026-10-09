"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AddToCalendar } from "@/components/add-to-calendar";
import { useMountedAround, useRotation } from "@/components/carousel-hooks";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import { EventDescriptionMedia } from "@/components/event-media";
import { RotationProgress } from "@/components/rotation-progress";
import { SectionKicker } from "@/components/section-kicker";
import type { CalendarOption } from "@/lib/calendars";
import type { ImageSize } from "@/lib/image-size";

export type EventsHeroItem = {
  id: string;
  title: string;
  href: string;
  date: string | null;
  weekday: string | null;
  month: string | null;
  day: string | null;
  time: string | null;
  venue: string | null;
  repeat: string | null;
  summary: string | null;
  calendar: CalendarOption[] | null;
  description: string | null;
  flyerUrl: string | null;
  flyerSize: ImageSize | null;
  flyerAlt: string;
};

type Labels = {
  kickerAccent: string;
  kickerCaption: string;
  headingLine1: string;
  headingLine2: string;
  empty: string;
  viewAll: string;
  next: string;
  upcoming: string;
  date: string;
  time: string;
  where: string;
  repeats: string;
  details: string;
  addToCalendar: string;
  chooseCalendar: string;
  panelTitle: string;
  list: string;
  pause: string;
  play: string;
};

const FLYER_SIZES =
  "(max-width: 640px) 90vw, (max-width: 1024px) 20rem, (max-width: 1280px) 24rem, 30rem";

const FLYER_FALLBACK_SIZE: ImageSize = { width: 800, height: 1000 };

function flyerSize(item: EventsHeroItem) {
  return item.flyerSize ?? FLYER_FALLBACK_SIZE;
}

function flyerAspect(item: EventsHeroItem) {
  if (!item.flyerUrl) return 5 / 4;
  const size = flyerSize(item);
  return size.width / size.height;
}

function eventFacts(item: EventsHeroItem, labels: Labels) {
  return [
    { emoji: "📅", label: labels.date, value: item.date, strong: true },
    { emoji: "🕒", label: labels.time, value: item.time, strong: false },
    { emoji: "📍", label: labels.where, value: item.venue, strong: false },
    { emoji: "🔁", label: labels.repeats, value: item.repeat, strong: false },
  ].filter((fact) => fact.value);
}

function HeroHeading({ labels }: { labels: Labels }) {
  return (
    <div className="enter-stagger">
      <SectionKicker
        accent={labels.kickerAccent}
        caption={labels.kickerCaption}
        tone="photo"
        size="lg"
        entrance="load"
      />
      <h1 className="mt-4 font-display text-3xl leading-snug font-light tracking-[0.04em] text-balance uppercase sm:text-4xl">
        <span className="block text-white">{labels.headingLine1}</span>
        <span className="block font-normal text-white">
          {labels.headingLine2}
        </span>
      </h1>
    </div>
  );
}

export function EventsHeroCarousel({
  items,
  backdropSrc,
  viewAllHref,
  labels,
}: {
  items: EventsHeroItem[];
  backdropSrc: string;
  viewAllHref: string;
  labels: Labels;
}) {
  const [introDone, setIntroDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const rotation = useRotation({
    count: items.length,
    viewRef: rootRef,
    held: !introDone || menuOpen,
  });
  const { active } = rotation;

  // The intro starts when the server HTML is parsed, so on a slow phone it can
  // end before hydration, and React never replays a missed animationend.
  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;
    let cancelled = false;
    const animations = intro
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName === "hero-intro",
      );
    Promise.allSettled(animations.map((animation) => animation.finished)).then(
      () => {
        if (!cancelled) setIntroDone(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Choosing another event from the keyboard sends no pointerdown, so a menu
  // left open in the now-hidden panel would hold rotation until the next click.
  useEffect(() => {
    rootRef.current
      ?.querySelectorAll<HTMLDetailsElement>("[inert] details[open]")
      .forEach((menu) => {
        menu.open = false;
      });
  }, [active]);
  const mounted = useMountedAround(active, items.length);

  const introLate = introDone ? "" : "hero-intro-late";

  // The tallest flyer sets the frame, so one mounting later never moves the
  // strip below it.
  const frameAspect = Math.min(...items.map(flyerAspect));

  return (
    <div ref={rootRef} {...rotation.focusProps}>
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src={backdropSrc}
          alt=""
          fill
          preload
          sizes="100vw"
          className="hero-intro-photo object-cover"
        />
      </div>
      <div
        aria-hidden="true"
        className="hero-intro-scrim absolute inset-0 bg-gradient-to-b from-ink-deep/85 via-navy/75 to-navy/85 lg:bg-gradient-to-r lg:from-ink-deep/95 lg:via-navy/90 lg:via-45% lg:to-navy/15 lg:to-90% xl:from-30% xl:via-navy/40 xl:via-60% xl:to-ink-deep/95 xl:to-80%"
      />
      <div
        aria-hidden="true"
        className="hero-intro-scrim absolute inset-x-0 top-0 hidden h-96 bg-gradient-to-b from-ink-deep/90 from-30% to-transparent lg:block"
      />
      <div
        aria-hidden="true"
        className="hero-intro-scrim absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-navy from-25% via-navy/60 to-transparent"
      />

      {/* The bottom padding keeps the strip above the wave divider underneath. */}
      <div
        ref={introRef}
        className={`relative mx-auto max-w-wide px-5 pt-8 pb-24 sm:px-10 sm:pt-10 lg:px-16 lg:pt-10 ${
          introDone ? "" : "hero-intro"
        }`}
      >
        {items.length === 0 ? (
          <>
            <HeroHeading labels={labels} />
            <p
              className={`mt-8 max-w-2xl text-xl leading-relaxed text-white/90 ${introLate}`}
            >
              {labels.empty}
            </p>
          </>
        ) : (
          <>
            <div className="grid gap-10 md:grid-cols-2 md:items-center lg:gap-x-14 xl:flex xl:flex-wrap xl:items-center xl:gap-x-12">
              <div className="md:col-span-2 xl:w-full">
                <HeroHeading labels={labels} />
              </div>
              <div className={`xl:w-1/3 xl:shrink-0 ${introLate}`}>
                <div className="grid">
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      id={`hero-event-${item.id}`}
                      role="tabpanel"
                      aria-labelledby={`hero-event-tab-${item.id}`}
                      inert={i !== active}
                      className="col-start-1 row-start-1 max-w-xl transition-opacity duration-500 ease-in-out"
                      style={{ opacity: i === active ? 1 : 0 }}
                    >
                      {/* Adding the class on activation replays the staggered entrance;
                          a key would remount the outgoing panel too and replay it mid-fade. */}
                      <div className={i === active ? "enter-stagger" : ""}>
                        <p>
                          <span className="inline-block rounded-xs bg-magenta px-3 py-1.5 font-display text-sm font-semibold tracking-[0.18em] text-white uppercase">
                            {i === 0 ? labels.next : labels.upcoming}
                          </span>
                        </p>
                        <h2 className="mt-4 font-display text-3xl leading-tight font-medium text-white text-pretty sm:text-4xl">
                          {item.title}
                        </h2>
                        <ul className="mt-6 space-y-3">
                          {eventFacts(item, labels).map((fact) => (
                            <li
                              key={fact.label}
                              className="flex items-start gap-3 text-lg leading-snug sm:text-xl"
                            >
                              <span
                                aria-hidden="true"
                                className="w-8 shrink-0 text-center text-2xl leading-none"
                              >
                                {fact.emoji}
                              </span>
                              <span
                                className={
                                  fact.strong
                                    ? "font-display font-medium text-white"
                                    : "text-white/90"
                                }
                              >
                                <span className="sr-only">{fact.label}: </span>
                                {fact.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {item.summary && (
                          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
                            {item.summary}
                          </p>
                        )}
                        <div className="relative z-20 mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                          <Link
                            href={item.href}
                            className="button-light px-7 py-4 text-center text-base"
                          >
                            {labels.details}
                          </Link>
                          {item.calendar && (
                            <AddToCalendar
                              tone="dark"
                              placement="above"
                              label={labels.addToCalendar}
                              menuLabel={labels.chooseCalendar}
                              options={item.calendar}
                              onOpenChange={setMenuOpen}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`flex justify-center xl:min-w-0 xl:flex-1 ${introLate}`}
              >
                <div
                  className="grid w-full max-w-sm max-h-150 place-items-center md:w-80 md:max-w-none lg:w-96 xl:box-content xl:h-hero-flyer xl:w-full xl:py-3.5"
                  style={{ aspectRatio: frameAspect }}
                >
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      aria-hidden={i !== active}
                      className="col-start-1 row-start-1 flex w-full justify-center transition-opacity duration-500 ease-in-out"
                      style={{ opacity: i === active ? 1 : 0 }}
                    >
                      {item.flyerUrl ? (
                        mounted.includes(i) && (
                          <div className="flyer-mount seigaiha-rings seigaiha-rings-gold w-fit max-w-full">
                            <Image
                              src={item.flyerUrl}
                              alt={item.flyerAlt}
                              width={flyerSize(item).width}
                              height={flyerSize(item).height}
                              preload={i === 0}
                              sizes={FLYER_SIZES}
                              className="relative h-auto max-h-144 w-auto max-w-full ring-1 ring-ink/10 xl:max-h-hero-flyer"
                            />
                          </div>
                        )
                      ) : (
                        <div className="flyer-mount seigaiha-rings seigaiha-rings-gold w-full">
                          <EventDescriptionMedia
                            description={item.description}
                            index={i}
                            className="relative"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`md:col-span-2 xl:w-xs xl:shrink-0 ${introLate}`}>
                <div className="flex items-center justify-between gap-6">
                  <span className="font-display text-sm font-semibold tracking-[0.2em] text-sky uppercase">
                    {labels.panelTitle}
                  </span>
                  {rotation.canRotate && (
                    <CarouselPlayToggle
                      stopped={rotation.stopped}
                      onToggle={rotation.toggle}
                      pauseLabel={labels.pause}
                      playLabel={labels.play}
                      className="h-11 w-11 border-white/50 bg-transparent text-white hover:bg-white hover:text-navy"
                    />
                  )}
                </div>
                <div
                  role="tablist"
                  aria-label={labels.list}
                  className="mt-3 flex flex-col gap-1.5 lg:grid lg:auto-cols-fr lg:grid-flow-col lg:gap-3 xl:flex xl:gap-1.5"
                >
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      id={`hero-event-tab-${item.id}`}
                      type="button"
                      role="tab"
                      aria-selected={i === active}
                      aria-controls={`hero-event-${item.id}`}
                      onClick={() => rotation.show(i)}
                      className={`relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 overflow-clip rounded-sm px-3 py-3 text-left transition-colors lg:pt-4 ${
                        i === active ? "bg-white/10" : "hover:bg-white/10"
                      }`}
                    >
                      {i === active && (
                        <RotationProgress
                          rotation={rotation}
                          intervalClassName="hero-progress"
                          className="absolute inset-x-0 top-0 h-1 bg-sky"
                        />
                      )}
                      <span className="flex min-w-18 flex-col leading-none whitespace-nowrap">
                        <span className="font-display text-sm font-bold tracking-[0.18em] text-white/85 uppercase">
                          {item.month}
                        </span>
                        <span className="mt-1 font-display text-3xl font-semibold text-white">
                          {item.day}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-base leading-snug font-semibold text-pretty ${
                            i === active ? "text-white" : "text-white/85"
                          }`}
                        >
                          {item.title}
                        </span>
                        {(item.weekday || item.time) && (
                          <span className="mt-1 block text-sm leading-snug text-white/80">
                            {[item.weekday, item.time]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <Link
                  href={viewAllHref}
                  className="link-arrow mt-4 inline-block font-display text-base font-semibold text-sky hover:text-white"
                >
                  {labels.viewAll}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
