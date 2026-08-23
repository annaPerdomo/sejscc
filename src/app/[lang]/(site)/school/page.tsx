import type { Metadata } from "next";
import { BrushEdge } from "@/components/brush-edge";
import { ExternalLink } from "@/components/external-link";
import { HeroPhotos } from "@/components/hero-photos";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PageHero } from "@/components/page-hero";
import { PageSection } from "@/components/page-section";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { SchoolLevels } from "@/components/school-levels";
import { SchoolYear } from "@/components/school-year";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { WaveDivider } from "@/components/wave-divider";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { ADULT_REGISTRATION_URL, YOUTH_REGISTRATION_URL } from "@/lib/school";

// The layout's announcement bar shows the next upcoming event; without this
// revalidation a past event would linger there until the next deploy.
export const revalidate = 300;

const SCHOOL_EMAIL = "gakuen@sejscc.org";
const SCHOOL_PHONE = "(562) 863-5996";
const SCHOOL_PHONE_HREF = "tel:+15628635996";

const HERO_LAYOUT = [
  "lg:col-start-2 lg:col-span-6 lg:row-start-1 lg:row-span-5",
  "lg:col-start-8 lg:col-span-5 lg:row-start-2 lg:row-span-6",
  "lg:col-start-3 lg:col-span-6 lg:row-start-6 lg:row-span-5",
  "lg:col-start-9 lg:col-span-4 lg:row-start-9 lg:row-span-4",
];

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.school.metaTitle,
    description: dict.school.metaDescription,
    alternates: {
      canonical: localePath(lang, "/school"),
      languages: {
        en: "/school",
        ja: "/ja/school",
        "x-default": "/school",
      },
    },
  };
}

export default async function SchoolPage() {
  const [dict, lang] = await Promise.all([getDictionary(), getLocale()]);
  const href = (path: string) => localePath(lang, path);

  const planLinks: Record<string, { href: string; variant: "primary" | "ink" | "magenta" }> = {
    youth: { href: YOUTH_REGISTRATION_URL, variant: "primary" },
    adult: { href: ADULT_REGISTRATION_URL, variant: "ink" },
    dues: { href: `${href("/payments")}#dues`, variant: "magenta" },
  };

  return (
    <>
      <PageHero
        id="school"
        wash="section-wash-school-hero"
        watermark="学"
        watermarkClassName="-bottom-28 -left-14 text-indigo/5"
        accent={dict.school.kickerAccent}
        caption={dict.school.kickerCaption}
        titleLine1={dict.school.titleLine1}
        titleLine2={dict.school.titleLine2}
        lede={dict.school.lede}
        actions={
          <>
            <ExternalLink
              href={YOUTH_REGISTRATION_URL}
              className="button-primary rounded-lg px-6 py-3.5 font-display text-sm font-semibold text-white"
            >
              {dict.school.registerCta}
            </ExternalLink>
            <a
              href="#tuition"
              className="font-display text-sm font-semibold text-magenta hover:text-magenta-deep"
            >
              {dict.school.tuitionCta}
            </a>
          </>
        }
        facts={
          <dl className="surface-card grid gap-px overflow-clip bg-line sm:grid-cols-2 lg:grid-cols-4">
            {dict.school.facts.map((fact) => (
              <div key={fact.label} className="bg-white px-5 py-4">
                <dt className="font-display text-[11px] font-semibold tracking-[0.18em] text-stone uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-1.5 font-display text-base font-semibold text-ink">
                  {fact.value}
                  <span className="mt-1 block font-sans text-xs font-normal text-ink-soft">
                    {fact.note}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        }
        media={
          <HeroPhotos
            layout={HERO_LAYOUT}
            tileClassName="aspect-photo w-full rounded-sm border border-line shadow-sm lg:aspect-auto"
            placeholderLabel={dict.school.photoLabel}
            className="grid w-full shrink-0 grid-cols-2 gap-3 lg:h-104 lg:w-112 lg:grid-cols-12 lg:grid-rows-12 lg:gap-4 xl:h-124 xl:w-132"
          />
        }
      />

      <PageSection
        id="classes"
        surface="white"
        watermark="語"
        watermarkClassName="-top-24 -right-14 text-indigo/5"
        accent={dict.school.classes.accent}
        caption={dict.school.classes.caption}
        title={
          <>
            <span className="text-indigo">{dict.school.classes.titleLead}</span>{" "}
            {dict.school.classes.titleRest}
          </>
        }
        lede={dict.school.classes.lede}
      >
        <SchoolLevels
          levels={dict.school.classes.levels}
          tablistLabel={dict.school.classes.tablistLabel}
          photoLabel={dict.school.photoLabel}
        />
      </PageSection>

      <section
        id="year"
        className="section-navy-scene relative scroll-mt-28 overflow-clip text-white"
      >
        <KanjiWatermark char="祭" className="-bottom-24 -left-14 text-white/5" />
        <WaveDivider id="school-year-top" position="top" seed={12} className="relative text-white" />
        <div className="relative mx-auto max-w-6xl px-4 pt-4 pb-8 sm:px-6 sm:pb-12">
          <div className="reveal-rise mb-9 text-center">
            <SectionKicker
              accent={dict.school.year.accent}
              caption={dict.school.year.caption}
              tone="sky"
              className="justify-center"
            />
            <h2 className="mt-3.5 font-display text-3xl font-normal tracking-[0.02em] sm:text-4xl">
              <span className="text-white">{dict.school.year.titleLead}</span>{" "}
              <span className="text-sky">{dict.school.year.titleRest}</span>
            </h2>
            <p className="mx-auto mt-3.5 max-w-2xl leading-relaxed text-white/75">
              {dict.school.year.lede}
            </p>
          </div>
          <div className="reveal-rise">
            <SchoolYear
              months={dict.school.year.months}
              tablistLabel={dict.school.year.tablistLabel}
              photoLabel={dict.school.photoLabel}
            />
          </div>
        </div>
        <WaveDivider id="school-year-bottom" seed={23} className="text-mist" />
      </section>

      <section
        id="tuition"
        className="seigaiha-rings relative scroll-mt-28 bg-mist pt-14 pb-20 sm:pt-16 sm:pb-24"
      >
        <BrushEdge id="school-tuition" variant="paper" className="absolute inset-x-0 bottom-0" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal-rise mb-10 text-center">
            <SectionKicker
              accent={dict.school.tuition.accent}
              caption={dict.school.tuition.caption}
              className="justify-center"
            />
            <SectionHeading className="mt-3.5">
              <span className="text-indigo">{dict.school.tuition.titleLead}</span>{" "}
              {dict.school.tuition.titleRest}
            </SectionHeading>
            <p className="mx-auto mt-3.5 max-w-xl leading-relaxed text-ink-soft">
              {dict.school.tuition.lede}
            </p>
          </div>

          <div className="grid items-stretch gap-5 lg:grid-cols-3">
            {dict.school.tuition.plans.map((plan) => {
              // Plan ids come from the dictionary, so a locale can carry one this map lacks.
              const link = planLinks[plan.id];
              if (!link) return null;
              const featured = plan.id === "youth";

              return (
                <div
                  key={plan.id}
                  className={`surface-card reveal-rise relative flex flex-col p-6 sm:p-7 ${
                    featured ? "border-2 border-indigo" : ""
                  }`}
                >
                  <p
                    className={`font-display text-[11px] font-semibold tracking-[0.14em] uppercase ${
                      featured
                        ? "absolute -top-3 left-6 rounded-md bg-indigo px-3 py-1.5 text-white"
                        : plan.id === "dues"
                          ? "text-magenta"
                          : "text-indigo"
                    }`}
                  >
                    {plan.badge}
                  </p>
                  <h3
                    className={`font-display text-lg font-semibold text-ink ${
                      featured ? "mt-3" : "mt-2.5"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone">{plan.meta}</p>
                  <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-4xl leading-none font-semibold text-ink">
                      {plan.price}
                    </span>
                    <span className="font-display text-sm text-ink-soft">{plan.priceNote}</span>
                  </p>
                  <ul className="mt-5 mb-6 flex flex-col gap-2.5 text-sm leading-relaxed text-ink-soft">
                    {plan.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <ExternalLink
                    href={link.href}
                    className={`mt-auto rounded-lg py-3 text-center font-display text-sm font-semibold ${
                      link.variant === "primary"
                        ? "button-primary text-white"
                        : link.variant === "magenta"
                          ? "border-2 border-magenta text-magenta hover:bg-magenta hover:text-white"
                          : "border-2 border-ink/20 text-ink hover:border-ink"
                    }`}
                  >
                    {plan.cta}
                  </ExternalLink>
                </div>
              );
            })}
          </div>

          <p className="mt-7 text-center text-sm text-ink-soft">{dict.school.tuition.note}</p>
        </div>
      </section>

      <section className="section-wash-history relative overflow-clip">
        <KanjiWatermark char="心" className="-bottom-16 right-2 text-ink/5" />
        <div className="relative mx-auto grid max-w-6xl gap-11 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="reveal-rise">
            <SectionKicker
              accent={dict.school.history.accent}
              caption={dict.school.history.caption}
              tone="magenta"
              order="caption-first"
            />
            <h2 className="mt-5 font-display text-3xl leading-snug font-normal tracking-[0.02em] sm:text-4xl">
              <span className="block text-ink">{dict.school.history.titleLine1}</span>
              <span className="block text-magenta">{dict.school.history.titleLine2}</span>
            </h2>
            {dict.school.history.body.map((paragraph, i) => (
              <p
                key={paragraph}
                className={`max-w-lg leading-relaxed text-ink-soft ${i === 0 ? "mt-5" : "mt-4"}`}
              >
                {paragraph}
              </p>
            ))}
            <div className="surface-card mt-8 p-6 sm:p-7">
              <p className="font-display text-[11px] font-semibold tracking-[0.18em] text-magenta uppercase">
                {dict.school.history.missionLabel}
              </p>
              <blockquote className="mt-3 font-accent text-lg leading-loose text-ink">
                {dict.school.history.mission}
              </blockquote>
            </div>
          </div>
          <div className="reveal-rise flex flex-col items-center gap-6">
            {[
              { label: dict.school.history.thenCaption, photo: dict.school.history.thenPhotoLabel },
              { label: dict.school.history.nowCaption, photo: dict.school.photoLabel },
            ].map((frame, i) => (
              <figure
                key={frame.label}
                className={`w-full max-w-sm bg-white p-2.5 pb-4 shadow-lg ${
                  i === 0 ? "lg:-rotate-2" : "lg:rotate-2"
                }`}
              >
                <PhotoPlaceholder label={frame.photo} frame={false} className="aspect-photo w-full" />
                <figcaption className="mt-2.5 text-center font-display text-[11px] font-semibold tracking-[0.14em] text-stone uppercase">
                  {frame.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="seigaiha-rings seigaiha-rings-sky relative bg-navy text-white">
        <WaveDivider
          id="school-join-top"
          position="top"
          seed={31}
          className="relative text-paper"
        />
        <div className="relative mx-auto max-w-3xl px-4 pt-4 pb-16 text-center sm:px-6 sm:pb-20">
          <p lang="ja" className="reveal-rise font-accent text-base font-bold tracking-[0.22em] text-sky">
            {dict.school.join.accent}
          </p>
          <h2 className="reveal-rise mt-4 font-display text-3xl font-normal tracking-[0.02em] sm:text-4xl">
            <span className="text-white">{dict.school.join.titleLead}</span>{" "}
            <span className="text-sky">{dict.school.join.titleRest}</span>
          </h2>
          <p className="reveal-rise mt-4 leading-relaxed text-white/75">
            {dict.school.join.leadBefore}
            <a href={`mailto:${SCHOOL_EMAIL}`} className="font-semibold text-white hover:text-sky">
              {SCHOOL_EMAIL}
            </a>
            {dict.school.join.leadBetween}
            <a href={SCHOOL_PHONE_HREF} className="font-semibold text-white hover:text-sky">
              {SCHOOL_PHONE}
            </a>
            {dict.school.join.leadAfter}
          </p>
          <div className="reveal-rise mt-8 flex flex-wrap justify-center gap-3">
            <ExternalLink
              href={YOUTH_REGISTRATION_URL}
              className="button-primary rounded-lg px-7 py-3.5 font-display text-sm font-semibold text-white"
            >
              {dict.school.join.registerCta}
            </ExternalLink>
            <a
              href={`mailto:${SCHOOL_EMAIL}`}
              className="rounded-lg border-2 border-white/50 px-7 py-3 font-display text-sm font-semibold text-white hover:border-white hover:bg-white/10"
            >
              {dict.school.join.emailCta}
            </a>
          </div>
          <p className="reveal-rise mt-6 text-xs text-white/70">{dict.school.join.note}</p>
        </div>
      </section>
    </>
  );
}
