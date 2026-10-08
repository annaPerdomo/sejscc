import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { SectionKicker } from "@/components/section-kicker";
import { WaveDivider } from "@/components/wave-divider";

const SETTLES_INTO = {
  paper: "text-paper",
  white: "text-white",
  cream: "text-cream",
  mist: "text-mist",
} as const;

// Darkening the wash is safe; thinning it drops the sky title line and the
// white lede under AA where the photo is brightest.
export function PhotoHero({
  id,
  photo,
  photoAlt,
  accent,
  caption,
  titleLine1,
  titleLine2,
  lede,
  eyebrow,
  actions,
  aside,
  asideAt = "end",
  ornament,
  below,
  children,
  settlesInto,
}: {
  /** Unique per page — namespaces the wave divider's brush filter. */
  id: string;
  photo: string | StaticImageData;
  /** Empty when the photo is only a backdrop. */
  photoAlt: string;
  accent: string;
  caption: string;
  titleLine1: string;
  titleLine2?: string;
  lede?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  asideAt?: "start" | "end";
  ornament?: ReactNode;
  below?: ReactNode;
  children?: ReactNode;
  settlesInto: keyof typeof SETTLES_INTO;
}) {
  const asideAtStart = aside && asideAt === "start";
  const asideAtEnd = aside && asideAt === "end";

  const text = (
    <div
      className={`enter-stagger ${
        asideAtEnd
          ? "lg:col-span-7"
          : asideAtStart
            ? "max-w-3xl lg:max-w-xl xl:max-w-2xl"
            : "max-w-3xl"
      }`}
    >
      {eyebrow && <div className="mb-6">{eyebrow}</div>}
      <SectionKicker
        accent={accent}
        caption={caption}
        tone="photo"
        size="lg"
        entrance="load"
      />
      <h1 className="mt-5 font-display text-4xl leading-none font-light tracking-[0.01em] text-balance sm:text-6xl xl:text-7xl">
        <span className="block text-white">{titleLine1}</span>
        {titleLine2 && (
          <span className="mt-2 block font-normal text-sky">{titleLine2}</span>
        )}
      </h1>
      {lede && (
        <div className="mt-7 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
          {lede}
        </div>
      )}
      {actions && (
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          {actions}
        </div>
      )}
      {children}
    </div>
  );

  const belowRow = below && <div className="enter-rise lg:col-span-12">{below}</div>;

  return (
    <section className="edge-flush relative isolate overflow-clip bg-ink-deep text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src={photo}
          alt={photoAlt}
          fill
          preload
          sizes="100vw"
          className="hero-intro-photo object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-ink-deep/90 via-navy/90 to-ink-deep/95 lg:bg-gradient-to-r lg:from-ink-deep/95 lg:via-navy/90 lg:via-50% lg:to-navy/10 lg:to-85%"
        />
        {/* A row laid along the bottom runs out past the side wash, so the
            bottom one rises to cover it. */}
        <div
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-deep to-transparent ${
            below ? "h-120 via-ink-deep/90 via-60%" : "h-56 via-ink-deep/70"
          }`}
        />
      </div>
      {ornament}

      <div
        className={`relative mx-auto flex max-w-wide flex-col justify-center gap-12 px-5 pb-28 sm:px-10 sm:pb-36 lg:min-h-page-hero lg:px-16 ${
          ornament ? "pt-32 sm:pt-36" : "pt-14 sm:pt-18"
        } ${asideAtEnd ? "lg:grid lg:grid-cols-12 lg:items-center lg:gap-10" : ""}`}
      >
        {asideAtStart ? (
          <div className="lg:-ml-8 lg:flex lg:items-start lg:gap-20">
            <div className="enter-rise">{aside}</div>
            <div className="flex flex-col gap-12 lg:flex-1">
              {text}
              {belowRow}
            </div>
          </div>
        ) : (
          <>
            {text}
            {asideAtEnd && <div className="enter-rise lg:col-span-5">{aside}</div>}
            {belowRow}
          </>
        )}
      </div>

      <WaveDivider
        id={`${id}-hero`}
        seed={9}
        className={`absolute inset-x-0 bottom-0 ${SETTLES_INTO[settlesInto]}`}
      />
    </section>
  );
}
