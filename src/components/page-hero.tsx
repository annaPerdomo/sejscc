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
  facts,
  actions,
  media,
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
  facts?: ReactNode;
  actions?: ReactNode;
  media: ReactNode;
}) {
  return (
    <section className={`relative overflow-clip ${wash}`}>
      <KanjiWatermark char={watermark} className={watermarkClassName} />
      <div
        className={`relative mx-auto grid max-w-6xl gap-10 px-4 pt-12 sm:px-6 sm:pt-14 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14 ${
          facts ? "pb-10" : "pb-16 lg:pb-24"
        }`}
      >
        <div className="reveal-rise">
          {eyebrow && <div className="mb-5">{eyebrow}</div>}
          <SectionKicker accent={accent} caption={caption} />
          <h1 className="mt-4 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl">
            <span className="block text-ink">{titleLine1}</span>
            {titleLine2 && <span className="block text-indigo">{titleLine2}</span>}
          </h1>
          <BrushRule id={id} className="mt-5" />
          {lede && (
            <p className="mt-6 max-w-xl leading-relaxed text-ink-soft">{lede}</p>
          )}
          {actions && (
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              {actions}
            </div>
          )}
        </div>
        {media}
      </div>
      {facts && (
        <div className="reveal-rise relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-20">
          {facts}
        </div>
      )}
      <BrushEdge id={`${id}-hero`} variant="paper" className="absolute inset-x-0 bottom-0" />
    </section>
  );
}
