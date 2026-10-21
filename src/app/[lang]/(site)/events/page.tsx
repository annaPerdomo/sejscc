import type { Metadata } from "next";
import Link from "next/link";
import { EventPoster } from "@/components/event-poster";
import { NextEventFeature } from "@/components/next-event-feature";
import { GoogleCalendar } from "@/components/google-calendar";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { HeroTitle } from "@/components/hero-title";
import { PhotoReel } from "@/components/photo-reel";
import { RevealMore } from "@/components/reveal-more";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { SectionDivider } from "@/components/section-divider";
import { calendarSources } from "@/lib/calendars";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { eventsPhotos } from "@/lib/photos";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";

export const revalidate = 300;

const UPCOMING_PREVIEW = 8;
const PAST_PREVIEW = 4;

const POSTER_GRID = "grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.events.metaTitle,
    description: dict.events.metaDescription,
    alternates: {
      canonical: localePath(lang, "/events"),
      languages: {
        en: "/events",
        ja: "/ja/events",
        "x-default": "/events",
      },
    },
  };
}

export default async function EventsPage() {
  const [dict, locale, upcoming, past, photos] = await Promise.all([
    getDictionary(),
    getLocale(),
    getUpcomingEvents(),
    getPastEvents(PAST_PREVIEW),
    getSitePhotos(),
  ]);
  const [next, ...later] = upcoming;
  const reel = dict.events.reel;
  const heroPhotos = eventsPhotos.reel.map((_src, i) =>
    slotPhoto(photos, `events.reel.${i}`, reel.photos[i]?.alt ?? "", locale)
  );

  return (
    <>
      <section className="section-navy-scene relative isolate flex flex-col overflow-clip text-white xl:block">
        <div className="relative mx-auto grid w-full max-w-wide px-5 pt-6 pb-16 sm:px-10 sm:pb-20 lg:px-16 xl:min-h-page-hero xl:grid-cols-12 xl:items-center xl:pt-14">
          <div className="enter-stagger xl:col-span-7">
            <SectionKicker
              accent={dict.events.kickerAccent}
              caption={dict.events.kickerCaption}
              tone="photo"
              size="lg"
              entrance="load"
            />
            <HeroTitle line1={dict.events.titleLine1} />
            {next ? (
              <NextEventFeature event={next} />
            ) : (
              <div className="mt-7 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
                <p>{dict.events.lede}</p>
                <p className="mt-4">{dict.events.empty}</p>
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
              {later.length > 0 && (
                <a
                  href="#upcoming"
                  className="link-arrow py-2 font-display text-lg font-semibold text-sky hover:text-white"
                >
                  {dict.events.moreUpcomingCta}
                </a>
              )}
              <a
                href="#calendars"
                className="link-arrow py-2 font-display text-lg font-semibold text-sky hover:text-white"
              >
                {dict.events.calendars.heroCta}
              </a>
            </div>
          </div>
        </div>
        <PhotoReel
          photos={heroPhotos}
          labels={{
            pause: reel.pause,
            play: reel.play,
            list: reel.list,
            photo: reel.photo,
          }}
          className="relative order-first h-72 sm:h-96 xl:absolute xl:inset-y-0 xl:right-0 xl:h-auto xl:w-5/12"
        />
      </section>
      <SectionDivider ornament="crest" />

      {later.length > 0 && (
        <section
          id="upcoming"
          className="relative scroll-mt-28 overflow-clip bg-azure pt-16 pb-20 sm:pt-20 sm:pb-28"
        >
          <KanjiWatermark char="催" className="-top-6 -right-10 text-indigo/5" />
          <div className="relative mx-auto max-w-wide px-5 sm:px-10 lg:px-16">
            <div className="mb-8 max-w-3xl">
              <SectionKicker
                accent={dict.events.upcomingAccent}
                caption={dict.events.upcomingCaption}
                tone="tinted"
                size="lg"
                entrance="load"
              />
              <SectionHeading className="mt-3">{dict.events.upcomingTitle}</SectionHeading>
            </div>

            <div className={POSTER_GRID}>
              {later.slice(0, UPCOMING_PREVIEW).map((event, i) => (
                <EventPoster key={event.id} event={event} index={i + 1} withSignup />
              ))}
            </div>
            <RevealMore
              moreLabel={dict.events.upcomingShowMore}
              lessLabel={dict.events.upcomingShowLess}
              more={
                later.length > UPCOMING_PREVIEW ? (
                  <div className={`mt-16 ${POSTER_GRID}`}>
                    {later.slice(UPCOMING_PREVIEW).map((event, i) => (
                      <div key={event.id} className="reveal-bloom">
                        <EventPoster
                          event={event}
                          index={UPCOMING_PREVIEW + i + 1}
                          withSignup
                        />
                      </div>
                    ))}
                  </div>
                ) : undefined
              }
            >
              <a
                href="#calendars"
                className="link-arrow py-2 font-display text-lg font-semibold text-indigo hover:text-indigo-deep"
              >
                {dict.events.calendars.sectionCta}
              </a>
            </RevealMore>
          </div>
        </section>
      )}

      <section
        id="calendars"
        className="seigaiha-rings seigaiha-rings-fade relative scroll-mt-28 bg-paper pt-16 pb-20 sm:pt-20 sm:pb-28"
      >
        <KanjiWatermark char="週" className="top-24 -right-14 text-indigo/5" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-10">
          <div className="reveal-rise mb-12 max-w-3xl">
            <SectionKicker
              accent={dict.events.calendars.accent}
              caption={dict.events.calendars.caption}
              size="lg"
            />
            <SectionHeading className="mt-4 sm:text-5xl">{dict.events.calendars.title}</SectionHeading>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              {dict.events.calendars.lede}
            </p>
          </div>
          <div className="grid gap-14">
            {calendarSources.map((source) => (
              <GoogleCalendar
                key={source.key}
                source={source}
                locale={locale}
                label={dict.events.calendars[source.key].label}
                description={dict.events.calendars[source.key].description}
                frameTitle={dict.events.calendars[source.key].frameTitle}
                openLabel={dict.events.calendars.openLabel}
              />
            ))}
          </div>
        </div>
      </section>

      {past.length > 0 && (
        <section id="past" className="relative scroll-mt-28 overflow-clip bg-mist pt-16 pb-20 sm:pt-20 sm:pb-28">
          <KanjiWatermark char="昔" className="-right-12 -bottom-20 text-indigo/5" />
          <div className="relative mx-auto max-w-wide px-5 sm:px-10 lg:px-16">
            <div className="reveal-rise mb-14 max-w-3xl">
              <SectionKicker
                accent={dict.events.pastAccent}
                caption={dict.events.pastCaption}
                size="lg"
              />
              <SectionHeading className="mt-4 sm:text-5xl">{dict.events.pastTitle}</SectionHeading>
            </div>
            <div className="reveal-stagger grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {past.slice(0, PAST_PREVIEW).map((event, i) => (
                <div key={event.id} className="reveal-bloom">
                  <EventPoster event={event} index={i} variant="compact" />
                </div>
              ))}
            </div>
            <div className="mt-12">
              <Link
                href={localePath(locale, "/events/past")}
                className="button-outline inline-block px-6 py-3.5 font-display text-base font-semibold"
              >
                {dict.events.pastArchiveCta}
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
