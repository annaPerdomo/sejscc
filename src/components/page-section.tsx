import type { ReactNode } from "react";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";

const surfaces = {
  white: "bg-white pt-12 pb-16 sm:pt-14 sm:pb-20",
  mist: "bg-mist py-14 sm:py-16",
};

export function PageSection({
  id,
  surface,
  watermark,
  watermarkClassName,
  accent,
  caption,
  title,
  lede,
  children,
}: {
  id?: string;
  surface: keyof typeof surfaces;
  watermark: string;
  watermarkClassName: string;
  accent: string;
  caption: string;
  title: ReactNode;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-clip ${id ? "scroll-mt-28" : ""} ${surfaces[surface]}`}
    >
      <KanjiWatermark char={watermark} className={watermarkClassName} />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="reveal-rise mb-9">
          <SectionKicker accent={accent} caption={caption} />
          <SectionHeading className="mt-3">{title}</SectionHeading>
          {lede && (
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{lede}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
