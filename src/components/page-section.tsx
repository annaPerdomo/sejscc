import type { ReactNode } from "react";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";

const surfaces = {
  white: "bg-white pt-12 pb-16 sm:pt-14 sm:pb-20",
  mist: "bg-mist py-14 sm:py-16",
  azure: "bg-azure py-14 sm:py-16",
  cream: "bg-cream py-14 sm:py-16",
};

const tightSurfaces = {
  white: "bg-white pt-7 pb-16 sm:pt-8 sm:pb-20",
  mist: "bg-mist pt-7 pb-14 sm:pt-8 sm:pb-16",
  azure: "bg-azure pt-7 pb-14 sm:pt-8 sm:pb-16",
  cream: "bg-cream pt-7 pb-14 sm:pt-8 sm:pb-16",
};

const kickerTones = {
  white: "indigo",
  mist: "indigo",
  azure: "tinted",
  cream: "tinted",
} as const;

export function PageSection({
  id,
  surface,
  tight = false,
  wide = false,
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
  tight?: boolean;
  wide?: boolean;
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
      className={`relative overflow-clip ${id ? "scroll-mt-28" : ""} ${
        (tight ? tightSurfaces : surfaces)[surface]
      }`}
    >
      <KanjiWatermark char={watermark} className={watermarkClassName} />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className={`reveal-rise ${tight ? "mb-6" : "mb-9"}`}>
          <SectionKicker
            accent={accent}
            caption={caption}
            tone={kickerTones[surface]}
          />
          <SectionHeading className="mt-3">{title}</SectionHeading>
          {lede && (
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{lede}</p>
          )}
        </div>
      </div>
      <div
        className={`relative mx-auto px-4 sm:px-6 ${
          wide ? "max-w-6xl 2xl:max-w-wide" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
