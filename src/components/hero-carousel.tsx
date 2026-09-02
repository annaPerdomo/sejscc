"use client";

import { useEffect, useState, type AnimationEvent } from "react";
import Image from "next/image";
import { CarouselPlayToggle } from "@/components/carousel-play-toggle";
import { ExternalLink } from "@/components/external-link";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { SectionKicker } from "@/components/section-kicker";
import { WaveDivider } from "@/components/wave-divider";

export type HeroTab = {
  id: string;
  tabLabel: string;
  tabLabelAccent: string;
  kickerAccent: string;
  kickerCaption: string;
  headingLine1: string;
  headingLine2: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  photoSrc?: string;
  photoAlt?: string;
  placeholderLabel: string;
};

export function HeroCarousel({
  tabs,
  tabsLabel,
  pauseLabel,
  playLabel,
}: {
  tabs: HeroTab[];
  tabsLabel: string;
  pauseLabel: string;
  playLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  // Mounting every photo up front would download them all on page load;
  // unmounting one mid-rotation would blank a side of the crossfade.
  const [mountedPhotos, setMountedPhotos] = useState<number[]>(() =>
    Array.from(new Set([0, 1 % tabs.length])),
  );

  const upcoming = (active + 1) % tabs.length;
  const rotating = !stopped && !reduceMotion;
  const paused = hoverPaused || focusPaused;
  if (!mountedPhotos.includes(active) || !mountedPhotos.includes(upcoming)) {
    setMountedPhotos(Array.from(new Set([...mountedPhotos, active, upcoming])));
  }

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const advance = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.animationName !== "tab-progress") return;
    setActive((i) => (i + 1) % tabs.length);
  };

  // Play clears the hover and focus holds too: the pointer is still inside,
  // and no mouseleave is coming to release them.
  const resume = () => {
    if (stopped) {
      setHoverPaused(false);
      setFocusPaused(false);
    }
    setStopped(!stopped);
  };

  return (
    <section
      className="edge-flush relative overflow-clip bg-navy"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setFocusPaused(true)}
      onBlur={() => setFocusPaused(false)}
    >
      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          {tab.photoSrc ? (
            mountedPhotos.includes(i) ? (
              <Image
                src={tab.photoSrc}
                alt={tab.photoAlt ?? ""}
                fill
                preload={i === 0}
                sizes="100vw"
                className={`object-cover ${i === active ? "hero-drift" : ""}`}
                style={{ objectPosition: "center 46%" }}
              />
            ) : null
          ) : (
            <PhotoPlaceholder
              dark
              frame={false}
              label={tab.placeholderLabel}
              className="h-full w-full"
            />
          )}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/65 via-40% to-transparent to-90%" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-navy/90 via-navy/45 to-transparent" />

      {/* The bottom padding is the clearance over the wave divider underneath;
          pinning this to the bottom drops text onto the wave when a heading wraps. */}
      <div className="relative flex min-h-[500px] flex-col px-5 pt-12 pb-14 sm:min-h-[540px] sm:px-10 sm:pt-14 sm:pb-20 lg:min-h-[max(600px,calc(100svh_-_400px))] lg:px-18 lg:pb-26">
        <div className="grid flex-1 content-center">
          {tabs.map((tab, i) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`hero-panel-${tab.id}`}
              aria-labelledby={`hero-tab-${tab.id}`}
              aria-hidden={i !== active}
              className="col-start-1 row-start-1 max-w-xl transition-opacity duration-500 ease-in-out lg:max-w-2xl"
              style={{
                opacity: i === active ? 1 : 0,
                pointerEvents: i === active ? "auto" : "none",
              }}
            >
              {/* Adding the class on activation replays the staggered entrance;
                  a key would remount the outgoing panel too and replay it mid-fade. */}
              <div className={i === active ? "enter-stagger" : ""}>
                <SectionKicker
                  accent={tab.kickerAccent}
                  caption={tab.kickerCaption}
                  tone="sky"
                  entrance="load"
                />
                <h1 className="mt-4 font-display text-xl leading-tight font-semibold tracking-[0.06em] uppercase sm:text-3xl lg:text-4xl">
                  <span className="block text-white">{tab.headingLine1}</span>
                  <span className="block text-sky">{tab.headingLine2}</span>
                </h1>
                <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 lg:text-lg">
                  {tab.body}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ExternalLink
                    href={tab.primaryCta.href}
                    tabIndex={i === active ? 0 : -1}
                    className="button-primary rounded-lg px-7 py-3.5 font-display text-sm font-semibold tracking-[0.03em] text-white"
                  >
                    {tab.primaryCta.label}
                  </ExternalLink>
                  {tab.secondaryCta && (
                    <ExternalLink
                      href={tab.secondaryCta.href}
                      tabIndex={i === active ? 0 : -1}
                      className="rounded-lg border-2 border-white/55 px-7 py-3 font-display text-sm font-semibold tracking-[0.03em] text-white hover:border-white hover:bg-white hover:text-ink"
                    >
                      {tab.secondaryCta.label}
                    </ExternalLink>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 flex items-start gap-4 border-t border-white/20">
          <div
            role="tablist"
            aria-label={tabsLabel}
            className="flex flex-1 gap-4 overflow-x-auto sm:gap-0"
          >
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                id={`hero-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls={`hero-panel-${tab.id}`}
                onClick={() => {
                  setActive(i);
                  setStopped(true);
                }}
                className={`relative -mt-px flex shrink-0 flex-col gap-1 border-t-2 border-transparent px-1 pt-3 text-left whitespace-nowrap transition sm:flex-1 ${
                  i === active ? "" : "hover:border-white/50"
                }`}
              >
                {i === active && (
                  <span
                    aria-hidden="true"
                    onAnimationEnd={advance}
                    className={`absolute inset-x-0 -top-0.5 h-0.5 bg-sky ${
                      rotating ? "tab-progress hero-progress" : ""
                    } ${rotating && paused ? "tab-progress-paused" : ""}`}
                  />
                )}
                <span
                  className={`hidden font-display text-xs font-semibold tracking-[0.05em] sm:block ${
                    i === active ? "text-white" : "text-white/60"
                  }`}
                >
                  {tab.tabLabel}
                </span>
                <span
                  className={`font-accent text-[11px] font-bold tracking-[0.15em] ${
                    i === active ? "text-white" : "text-white/70"
                  }`}
                >
                  {tab.tabLabelAccent}
                </span>
              </button>
            ))}
          </div>
          {!reduceMotion && (
            <CarouselPlayToggle
              stopped={stopped}
              onToggle={resume}
              pauseLabel={pauseLabel}
              playLabel={playLabel}
              className="mt-3 shrink-0 border-white/40 bg-transparent text-white hover:bg-white hover:text-indigo"
            />
          )}
        </div>
      </div>

      <WaveDivider id="hero" className="absolute inset-x-0 bottom-0 text-white" />
    </section>
  );
}
