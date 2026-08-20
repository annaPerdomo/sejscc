"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/photo-placeholder";

const ROTATE_MS = 6500;

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

export function HeroCarousel({ tabs, tabsLabel }: { tabs: HeroTab[]; tabsLabel: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % tabs.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, tabs.length]);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  return (
    <section
      className="relative overflow-hidden bg-navy"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className="relative min-h-[560px] sm:min-h-[640px] lg:min-h-[760px]">
        {tabs.map((tab, i) => (
          <div
            key={tab.id}
            aria-hidden="true"
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            {tab.photoSrc ? (
              <Image
                src={tab.photoSrc}
                alt={tab.photoAlt ?? ""}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: "center 46%" }}
              />
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
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/78 to-indigo/25" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-navy via-navy/80 to-transparent" />

        <div
          role="tablist"
          aria-label={tabsLabel}
          className="absolute inset-0 px-5 py-16 sm:px-10 sm:py-20 lg:px-18"
        >
          {tabs.map((tab, i) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`hero-panel-${tab.id}`}
              aria-labelledby={`hero-tab-${tab.id}`}
              aria-hidden={i !== active}
              className="absolute inset-x-5 top-1/2 max-w-xl -translate-y-1/2 transition-opacity duration-500 ease-in-out sm:inset-x-10 lg:left-18"
              style={{
                opacity: i === active ? 1 : 0,
                pointerEvents: i === active ? "auto" : "none",
              }}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="shrink-0 font-accent text-sm font-bold tracking-[0.2em] text-sky">
                  {tab.kickerAccent}
                </span>
                <span className="h-px w-9 shrink-0 bg-sky" />
                <span className="font-display text-xs font-semibold tracking-[0.2em] text-sky uppercase">
                  {tab.kickerCaption}
                </span>
              </div>
              <h1 className="mt-4 font-display text-3xl leading-tight font-normal tracking-[0.02em] sm:text-4xl">
                <span className="block text-white">{tab.headingLine1}</span>
                <span className="block text-sky">{tab.headingLine2}</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
                {tab.body}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={tab.primaryCta.href}
                  tabIndex={i === active ? 0 : -1}
                  className="button-primary rounded-lg px-7 py-3.5 font-display text-sm font-semibold tracking-[0.03em] text-white"
                >
                  {tab.primaryCta.label}
                </Link>
                {tab.secondaryCta && (
                  <Link
                    href={tab.secondaryCta.href}
                    tabIndex={i === active ? 0 : -1}
                    className="rounded-lg border-2 border-white/55 px-7 py-3 font-display text-sm font-semibold tracking-[0.03em] text-white hover:border-white hover:bg-white hover:text-ink"
                  >
                    {tab.secondaryCta.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute right-5 bottom-5 left-5 z-10 flex gap-4 overflow-x-auto border-t border-white/20 sm:right-10 sm:bottom-6 sm:left-10 sm:gap-0 lg:right-18 lg:left-18">
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
                setPaused(true);
              }}
              className={`-mt-px flex shrink-0 flex-col gap-1 border-t-2 px-1 pt-3 text-left whitespace-nowrap transition sm:flex-1 ${
                i === active ? "border-sky" : "border-transparent hover:border-white/50"
              }`}
            >
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
      </div>
    </section>
  );
}
