import type { ReactNode } from "react";
import { BrushEdge } from "@/components/brush-edge";
import { BrushRule } from "@/components/brush-rule";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { SectionKicker } from "@/components/section-kicker";

export function PageHero({
  id,
  wash,
  watermark,
  watermarkClassName,
  accent,
  caption,
  titleLine1,
  titleLine2,
  lede,
  eyebrow,
  below,
  actions,
  media,
  settlesInto,
  tight = false,
}: {
  /** Unique per page — namespaces the hero's SVG brush filters. */
  id: string;
  wash:
    | "section-wash-events-hero"
    | "section-wash-groups-hero"
    | "section-wash-payments-hero"
    | "section-wash-school-hero";
  watermark: string;
  watermarkClassName: string;
  accent: string;
  caption: string;
  titleLine1: string;
  titleLine2?: string;
  lede?: string;
  eyebrow?: ReactNode;
  below?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  settlesInto?: "white" | "mist" | "azure";
  tight?: boolean;
}) {
  const padding = tight
    ? "pt-6 pb-8 sm:pt-7 lg:pb-10"
    : `pt-9 sm:pt-11 ${below ? "pb-8" : "pb-12 lg:pb-18"}`;

  return (
    <section className={`edge-flush relative overflow-clip ${wash}`}>
      <KanjiWatermark char={watermark} className={watermarkClassName} />
      <div
        className={`relative mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:items-center ${
          tight ? "lg:gap-10" : "lg:gap-14"
        } ${media ? "lg:grid-cols-[1fr_auto]" : ""} ${padding}`}
      >
        <div className="enter-stagger">
          {eyebrow && <div className="mb-5">{eyebrow}</div>}
          <SectionKicker accent={accent} caption={caption} entrance="load" />
          <h1 className="mt-4 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl">
            <span className="block text-ink">{titleLine1}</span>
            {titleLine2 && <span className="block text-indigo">{titleLine2}</span>}
          </h1>
          <BrushRule id={id} className="mt-4" />
          {lede && (
            <p className="mt-5 max-w-xl leading-relaxed text-ink-soft">{lede}</p>
          )}
          {actions && (
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
              {actions}
            </div>
          )}
        </div>
        {media}
      </div>
      {below && (
        <div className="enter-rise relative mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:pb-12">
          {below}
        </div>
      )}
      <BrushEdge
        id={`${id}-hero`}
        variant="paper"
        settlesInto={settlesInto}
        className="absolute inset-x-0 bottom-0"
      />
    </section>
  );
}
