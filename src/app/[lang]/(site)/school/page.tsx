import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "@/components/external-link";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PhotoHero } from "@/components/photo-hero";
import { SchoolLevels } from "@/components/school-levels";
import { SchoolSeal } from "@/components/school-seal";
import { SchoolYear } from "@/components/school-year";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { SitePhoto } from "@/components/site-photo";
import { WaveDivider } from "@/components/wave-divider";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { schoolPhotos } from "@/lib/photos";
import { getSchoolLevels } from "@/lib/school-levels";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";
import { ADULT_REGISTRATION_URL, YOUTH_REGISTRATION_URL } from "@/lib/school";
import { buildSchoolYear } from "@/lib/school-year";

// The layout's announcement bar shows the next upcoming event; without this
// revalidation a past event would linger there until the next deploy.
export const revalidate = 300;

const SCHOOL_EMAIL = "gakuen@sejscc.org";
const SCHOOL_PHONE = "(562) 863-5996";
const SCHOOL_PHONE_HREF = "tel:+15628635996";

// Each plan is a panel of a folding screen; the text colors are the ones that
// clear AA on that panel's surface.
const PLAN_PANELS = {
  youth: {
    href: YOUTH_REGISTRATION_URL,
    panel: "seigaiha-rings seigaiha-rings-sky bg-navy text-white",
    badge: "bg-magenta text-white",
    meta: "text-sky",
    price: "text-white",
    note: "text-white/80",
    points: "text-white/90",
    cta: "button-light",
  },
  adult: {
    href: ADULT_REGISTRATION_URL,
    panel: "bg-cream text-ink",
    badge: "text-indigo",
    meta: "text-ink-soft",
    price: "text-ink",
    note: "text-ink-soft",
    points: "text-ink",
    cta: "button-primary text-white",
  },
  dues: {
    href: `mailto:${SCHOOL_EMAIL}`,
    panel: "bg-lilac text-ink",
    badge: "text-magenta-deep",
    meta: "text-ink-soft",
    price: "text-ink",
    note: "text-ink-soft",
    points: "text-ink",
    cta: "button-donate text-white",
  },
} as const;

function isPlanId(id: string): id is keyof typeof PLAN_PANELS {
  return id in PLAN_PANELS;
}

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
  const localePromise = getLocale();
  const [dict, lang, photos, levels] = await Promise.all([
    getDictionary(),
    localePromise,
    getSitePhotos(),
    localePromise.then((locale) => getSchoolLevels(locale)),
  ]);

  const year = buildSchoolYear(dict.school.year, schoolPhotos.events, new Date());

  const history = dict.school.history;
  const thenPhoto = slotPhoto(photos, "school.then", history.thenPhotoAlt, lang);
  const nowPhoto = slotPhoto(photos, "school.now", history.nowPhotoAlt, lang);
  const heroPhoto = slotPhoto(photos, "school.hero", dict.school.heroPhotoAlt, lang);
  const joinPhoto = slotPhoto(photos, "school.join", dict.school.join.photoAlt, lang);

  const heroPhotos = schoolPhotos.heroRotation.flatMap((_src, i) => {
    const alt = dict.school.heroRotationAlts[i];
    if (!alt) return [];
    return [slotPhoto(photos, `school.hero-rotation.${i}`, alt, lang)];
  });

  return (
    <>
      <PhotoHero
        id="school"
        photo={heroPhoto.src}
        photoAlt={heroPhoto.alt}
        photos={heroPhotos}
        rotationLabels={{
          pause: dict.school.heroPause,
          play: dict.school.heroPlay,
          list: dict.school.heroPhotosList,
          photo: dict.school.heroPhotoLabel,
        }}
        accent={dict.school.kickerAccent}
        caption={dict.school.kickerCaption}
        titleLine1={dict.school.titleLine1}
        titleLine2={dict.school.titleLine2}
        lede={<p>{dict.school.lede}</p>}
        settlesInto="paper"
        actions={
          <>
            <ExternalLink
              href={YOUTH_REGISTRATION_URL}
              className="button-light px-7 py-4 text-base"
            >
              {dict.school.registerCta}
            </ExternalLink>
            <a
              href="#tuition"
              className="link-arrow py-2 font-display text-lg font-semibold text-sky hover:text-white"
            >
              {dict.school.tuitionCta}
            </a>
          </>
        }
        asideAt="start"
        aside={
          <div className="relative hidden lg:block">
            <p
              lang="ja"
              className="school-plaque font-accent text-2xl font-bold tracking-[0.18em]"
            >
              {dict.home.japaneseSchool.plaque}
            </p>
            <SchoolSeal
              accent={dict.home.japaneseSchool.sealAccent}
              year={dict.home.japaneseSchool.sealYear}
              size="lg"
            />
          </div>
        }
        below={
          <dl className="enter-stagger grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
            {dict.school.facts.map((fact) => (
              <div key={fact.label}>
                <span aria-hidden="true" className="block h-1 w-10 bg-gold" />
                <dt className="mt-4 font-display text-sm font-semibold tracking-[0.18em] text-sky uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-1.5 font-display text-xl font-medium text-white">
                  {fact.value}
                  <span className="mt-1 block font-sans text-base font-normal text-white/80">
                    {fact.note}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        }
      />

      <section
        id="classes"
        className="seigaiha-rings seigaiha-rings-fade relative scroll-mt-28 bg-paper pt-10 pb-20 sm:pt-14 sm:pb-28"
      >
        <KanjiWatermark char="語" className="-top-10 -right-10 text-indigo/5" />
        <div className="relative mx-auto max-w-wide px-5 sm:px-10 lg:px-16">
          <div className="reveal-rise mb-12 max-w-3xl">
            <SectionKicker
              accent={dict.school.classes.accent}
              caption={dict.school.classes.caption}
              size="lg"
            />
            <SectionHeading className="mt-4 sm:text-5xl">
              <span className="text-indigo">{dict.school.classes.titleLead}</span>{" "}
              {dict.school.classes.titleRest}
            </SectionHeading>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              {dict.school.classes.lede}
            </p>
          </div>
          <SchoolLevels
            levels={levels}
            tablistLabel={dict.school.classes.tablistLabel}
            photoLabel={dict.school.photoLabel}
            unavailableLabel={dict.school.classes.statusUnavailable}
          />
        </div>
      </section>

      <section
        id="year"
        className="section-navy-scene edge-flush relative scroll-mt-28 overflow-clip text-white"
      >
        <KanjiWatermark char="祭" className="-bottom-24 -left-14 text-white/5" />
        <WaveDivider id="school-year-top" position="top" seed={12} className="relative text-paper" />
        <div className="relative mx-auto max-w-wide px-5 pt-6 pb-16 sm:px-10 sm:pb-24 lg:px-16">
          <div className="reveal-rise mb-8 grid gap-5 lg:mb-6 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-7">
              <SectionKicker
                accent={dict.school.year.accent}
                caption={dict.school.year.caption}
                tone="sky"
                size="lg"
              />
              <h2 className="mt-4 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl">
                <span className="text-white">{dict.school.year.titleLead}</span>{" "}
                <span className="text-sky">{dict.school.year.titleRest}</span>
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-white/85 lg:col-span-5">
              {dict.school.year.lede}
            </p>
          </div>
          <SchoolYear
            events={year.events}
            currentIndex={year.currentIndex}
            labels={{
              list: dict.school.year.listLabel,
              current: dict.school.year.currentLabel,
              pause: dict.school.year.pause,
              play: dict.school.year.play,
            }}
          />
        </div>
        <WaveDivider id="school-year-bottom" seed={23} className="text-mist" />
      </section>

      <section id="tuition" className="relative scroll-mt-28 bg-mist pt-10 sm:pt-14">
        <div className="reveal-rise mx-auto max-w-3xl px-5 text-center sm:px-10">
          <SectionKicker
            accent={dict.school.tuition.accent}
            caption={dict.school.tuition.caption}
            size="lg"
            className="justify-center"
          />
          <SectionHeading className="mt-4 sm:text-5xl">
            <span className="text-indigo">{dict.school.tuition.titleLead}</span>{" "}
            {dict.school.tuition.titleRest}
          </SectionHeading>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            {dict.school.tuition.lede}
          </p>
        </div>

        <div className="mt-12 border-y-8 border-gold bg-ink-deep sm:mt-14">
          <div className="reveal-stagger-3 grid gap-2 lg:grid-cols-3">
            {dict.school.tuition.plans.map((plan) => {
              // Plan ids come from the dictionary, so a locale can carry one this map lacks.
              if (!isPlanId(plan.id)) return null;
              const look = PLAN_PANELS[plan.id];
              const featured = plan.id === "youth";

              return (
                <div
                  key={plan.id}
                  className={`reveal-rise flex flex-col px-6 py-12 sm:px-12 sm:py-14 xl:px-16 ${look.panel}`}
                >
                  <p
                    className={`w-fit font-display text-sm font-semibold tracking-[0.16em] uppercase ${
                      featured ? `rounded-xs px-3 py-1.5 ${look.badge}` : look.badge
                    }`}
                  >
                    {plan.badge}
                  </p>
                  <h3 className="mt-5 font-display text-2xl leading-snug font-semibold">
                    {plan.name}
                  </h3>
                  <p className={`mt-2 text-base ${look.meta}`}>{plan.meta}</p>
                  <p className="mt-8 flex flex-wrap items-baseline gap-x-3">
                    <span
                      className={`font-display text-6xl leading-none font-light sm:text-7xl ${look.price}`}
                    >
                      {plan.price}
                    </span>
                    <span className={`font-display text-lg ${look.note}`}>{plan.priceNote}</span>
                  </p>
                  <ul className={`mt-8 mb-10 flex flex-col gap-3 text-lg leading-relaxed ${look.points}`}>
                    {plan.points.map((point) => (
                      <li key={point} className="flex items-baseline gap-3">
                        <span aria-hidden="true" className="size-2 shrink-0 rotate-45 bg-gold" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <ExternalLink
                    href={look.href}
                    className={`mt-auto rounded-lg px-6 py-4 text-center font-display text-base font-semibold ${look.cta}`}
                  >
                    {plan.cta}
                  </ExternalLink>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mx-auto max-w-3xl px-5 py-10 text-center text-lg leading-relaxed text-ink-soft sm:px-10">
          {dict.school.tuition.note}
        </p>
      </section>

      <section className="section-wash-history relative overflow-clip">
        <KanjiWatermark char="心" className="top-10 -right-6 text-ink/5" />
        <div className="relative mx-auto grid max-w-wide gap-10 px-5 pt-16 sm:px-10 sm:pt-24 lg:grid-cols-12 lg:gap-14 lg:px-16">
          <div className="reveal-rise lg:col-span-5">
            <SectionKicker
              accent={history.accent}
              caption={history.caption}
              tone="magenta"
              size="lg"
              order="caption-first"
            />
            <h2 className="mt-5 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl xl:text-6xl">
              <span className="block text-ink">{history.titleLine1}</span>
              <span className="block text-magenta">{history.titleLine2}</span>
            </h2>
          </div>
          <div className="reveal-rise flex flex-col gap-5 text-lg leading-relaxed text-ink-soft lg:col-span-7 lg:pt-3">
            {history.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="then-now">
          <div className="then-now-stage">
            <div className="mx-auto w-full max-w-wide px-5 sm:px-10 lg:px-16">
              <div className="flyer-mount">
                <div className="then-now-frame relative">
                  {[
                    {
                      photo: thenPhoto,
                      label: history.thenCaption,
                      placeholder: history.thenPhotoLabel,
                      className: "",
                      caption: "left-3 sm:left-5",
                    },
                    {
                      photo: nowPhoto,
                      label: history.nowCaption,
                      placeholder: dict.school.photoLabel,
                      className: "then-now-reveal",
                      caption: "right-3 sm:right-5",
                    },
                  ].map((frame) => (
                    <figure key={frame.label} className={`relative ${frame.className}`}>
                      <SitePhoto
                        photo={frame.photo}
                        sizes="(max-width: 1536px) 100vw, 90rem"
                        placeholderLabel={frame.placeholder}
                        className="aspect-band w-full"
                      />
                      <figcaption
                        className={`absolute bottom-3 rounded-xs bg-ink-deep/90 px-3 py-1.5 font-display text-xs font-semibold tracking-[0.16em] text-white uppercase sm:bottom-5 sm:px-4 sm:py-2 sm:text-sm ${frame.caption}`}
                      >
                        {frame.label}
                      </figcaption>
                    </figure>
                  ))}
                  <span aria-hidden="true" className="then-now-edge pointer-events-none relative">
                    <span className="absolute inset-y-0 left-0 w-1 -translate-x-1/2 bg-gold shadow-lg" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <figure className="reveal-rise relative mx-auto max-w-4xl px-5 pt-6 pb-20 text-center sm:px-10 sm:pb-28">
          <figcaption className="font-display text-sm font-semibold tracking-[0.2em] text-magenta uppercase">
            {history.missionLabel}
          </figcaption>
          <blockquote className="mt-6 font-accent text-2xl leading-loose text-ink sm:text-3xl sm:leading-loose">
            {history.mission}
          </blockquote>
        </figure>
      </section>

      <section className="relative isolate overflow-clip bg-ink-deep text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src={joinPhoto.src}
            alt={joinPhoto.alt}
            fill
            sizes="100vw"
            className="ken-burns-in object-cover"
          />
          {/* At this strength the sky heading and the white copy clear AA
              over the bright tables and paper in the photo. */}
          <div aria-hidden="true" className="absolute inset-0 bg-ink-deep/85" />
        </div>
        <WaveDivider id="school-join-top" position="top" seed={31} className="relative text-paper" />
        <div className="relative mx-auto max-w-3xl px-5 pt-10 pb-24 text-center sm:px-10 sm:pt-16 sm:pb-32">
          <p lang="ja" className="reveal-rise font-accent text-lg font-bold tracking-[0.22em] text-sky">
            {dict.school.join.accent}
          </p>
          <h2 className="reveal-rise mt-5 font-display text-5xl leading-tight font-light sm:text-6xl">
            <span className="text-white">{dict.school.join.titleLead}</span>{" "}
            <span className="font-normal text-sky">{dict.school.join.titleRest}</span>
          </h2>
          <p className="reveal-rise mt-6 text-lg leading-relaxed text-white/90 sm:text-xl">
            {dict.school.join.leadBefore}
            <a href={`mailto:${SCHOOL_EMAIL}`} className="font-semibold text-white underline decoration-sky underline-offset-4 hover:text-sky">
              {SCHOOL_EMAIL}
            </a>
            {dict.school.join.leadBetween}
            <a href={SCHOOL_PHONE_HREF} className="font-semibold text-white underline decoration-sky underline-offset-4 hover:text-sky">
              {SCHOOL_PHONE}
            </a>
            {dict.school.join.leadAfter}
          </p>
          <div className="reveal-rise mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ExternalLink
              href={YOUTH_REGISTRATION_URL}
              className="button-light px-8 py-4 text-center text-base"
            >
              {dict.school.join.registerCta}
            </ExternalLink>
            <a
              href={`mailto:${SCHOOL_EMAIL}`}
              className="button-outline-light px-8 py-3.5 text-center text-base"
            >
              {dict.school.join.emailCta}
            </a>
          </div>
          <p className="reveal-rise mt-8 text-base text-white/80">{dict.school.join.note}</p>
        </div>
      </section>
    </>
  );
}
