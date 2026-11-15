import type { Metadata } from "next";
import Link from "next/link";
import { EventPoster } from "@/components/event-poster";
import { NextEventFeature } from "@/components/next-event-feature";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PhotoHero } from "@/components/photo-hero";
import { RevealMore } from "@/components/reveal-more";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
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
      <PhotoHero
        photo={heroPhotos[0].src}
        photoAlt={heroPhotos[0].alt}
        photoFraming={heroPhotos[0].framing}
        photos={heroPhotos}
        rotationLabels={{
          pause: reel.pause,
          play: reel.play,
          list: reel.list,
          photo: reel.photo,
        }}
        accent={dict.events.kickerAccent}
        caption={dict.events.kickerCaption}
        titleLine1={dict.events.titleLine1}
        lede={
          next ? (
            <NextEventFeature event={next} />
          ) : (
            <div className="flex flex-col gap-4">
              <p>{dict.events.lede}</p>
              <p>{dict.events.empty}</p>
            </div>
          )
        }
        actions={
          <>
            {later.length > 0 && (
              <a href="#upcoming" className="button-light px-7 py-4 text-base">
                {dict.events.moreUpcomingCta}
              </a>
            )}
            <Link
              href={localePath(locale, "/calendar")}
              className="link-arrow py-2 font-display text-lg font-semibold text-sky hover:text-white"
            >
              {dict.events.calendarCta}
            </Link>
          </>
        }
      />

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
              <Link
                href={localePath(locale, "/calendar")}
                className="link-arrow py-2 font-display text-lg font-semibold text-indigo hover:text-indigo-deep"
              >
                {dict.events.calendarSectionCta}
              </Link>
            </RevealMore>
          </div>
        </section>
      )}

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
