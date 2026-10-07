import type { Metadata } from "next";
import Link from "next/link";
import { EventPoster } from "@/components/event-poster";
import { GoogleCalendar } from "@/components/google-calendar";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { LanternString } from "@/components/lantern-string";
import { PhotoHero } from "@/components/photo-hero";
import { RevealMore } from "@/components/reveal-more";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { calendarSources } from "@/lib/calendars";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { eventsPhotos } from "@/lib/photos";

export const revalidate = 300;

const UPCOMING_PREVIEW = 10;
const PAST_PREVIEW = 4;

const POSTER_GRID =
  "reveal-stagger-2-3 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

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
  const [dict, locale, upcoming, past] = await Promise.all([
    getDictionary(),
    getLocale(),
    getUpcomingEvents(),
    getPastEvents(PAST_PREVIEW),
  ]);
  const [next, ...later] = upcoming;

  return (
    <>
      <PhotoHero
        id="events"
        photo={eventsPhotos.hero}
        photoAlt={dict.events.heroPhotoAlt}
        accent={dict.events.kickerAccent}
        caption={dict.events.kickerCaption}
        titleLine1={dict.events.titleLine1}
        lede={<p>{dict.events.lede}</p>}
        settlesInto="cream"
        ornament={<LanternString id="events" tone="dark" className="absolute inset-x-0 top-0" />}
        actions={
          <>
            {next && (
              <a href="#upcoming" className="button-light px-7 py-4 text-base">
                {dict.events.upcomingTitle}
              </a>
            )}
            <a
              href="#calendars"
              className="link-arrow py-2 font-display text-lg font-semibold text-sky hover:text-white"
            >
              {dict.events.calendars.heroCta}
            </a>
          </>
        }
      />

      <section
        id="upcoming"
        className="relative scroll-mt-28 overflow-clip bg-cream pt-10 pb-20 sm:pt-14 sm:pb-28"
      >
        <KanjiWatermark char="催" className="-top-10 -left-10 text-magenta/5" />
        <div className="relative mx-auto max-w-wide px-5 sm:px-10 lg:px-16">
          <div className="reveal-rise mb-14 max-w-3xl">
            <SectionKicker
              accent={dict.events.upcomingAccent}
              caption={dict.events.upcomingCaption}
              tone="tinted"
              size="lg"
            />
            <SectionHeading className="mt-4 sm:text-5xl">{dict.events.upcomingTitle}</SectionHeading>
          </div>

          {next ? (
            <>
              <div className="reveal-rise mx-auto max-w-6xl">
                <EventPoster
                  event={next}
                  badge={dict.events.nextUpBadge}
                  withSignup
                  variant="feature"
                />
              </div>

              {later.length > 0 && (
                <div className={`mt-24 ${POSTER_GRID}`}>
                  {later.slice(0, UPCOMING_PREVIEW).map((event, i) => (
                    <div key={event.id} className="reveal-bloom">
                      <EventPoster event={event} index={i + 1} withSignup />
                    </div>
                  ))}
                </div>
              )}
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
            </>
          ) : (
            <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">{dict.events.empty}</p>
          )}
        </div>
      </section>

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
