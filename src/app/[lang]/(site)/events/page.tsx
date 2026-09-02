import type { Metadata } from "next";
import Link from "next/link";
import { EventCard, FOUR_UP_SIZES } from "@/components/event-card";
import { GoogleCalendar } from "@/components/google-calendar";
import { HeroPhotos } from "@/components/hero-photos";
import { PageHero } from "@/components/page-hero";
import { PageSection } from "@/components/page-section";
import { RevealMore } from "@/components/reveal-more";
import { calendarSources } from "@/lib/calendars";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { eventsHeroPhotos, photoFor } from "@/lib/photos";

export const revalidate = 300;

const UPCOMING_PREVIEW = 12;
const PAST_PREVIEW = 4;

// Tiles drop from the end on narrow screens: the two-column grid only fills
// whole rows at three tiles and at five.
const HERO_LAYOUT = [
  "col-span-2 aspect-photo lg:col-span-6 lg:row-span-7",
  "aspect-square lg:col-span-6 lg:row-span-7",
  "aspect-square lg:col-span-3 lg:row-span-5",
  "hidden aspect-square sm:block lg:col-span-3 lg:row-span-5",
  "hidden aspect-square sm:block lg:col-span-3 lg:row-span-5",
  "hidden lg:col-span-3 lg:row-span-5 lg:block",
];
const HERO_SIZES = [
  "(max-width: 1024px) 92vw, 17rem",
  "(max-width: 1024px) 46vw, 17rem",
  "(max-width: 1024px) 46vw, 8rem",
  "(max-width: 1024px) 46vw, 8rem",
  "(max-width: 1024px) 46vw, 8rem",
  "8rem",
];

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
    getPastEvents(),
  ]);

  const heroPhotos = eventsHeroPhotos.map((src, i) =>
    photoFor(src, dict.events.heroPhotoAlts[i])
  );

  return (
    <>
      <PageHero
        id="events"
        wash="section-wash-events-hero"
        watermark="祭"
        watermarkClassName="-right-14 -bottom-24 text-magenta/5"
        accent={dict.events.kickerAccent}
        caption={dict.events.kickerCaption}
        titleLine1={dict.events.titleLine1}
        lede={dict.events.lede}
        settlesInto="azure"
        tight
        actions={
          <a
            href="#calendars"
            className="button-primary rounded-lg px-6 py-3.5 font-display text-sm font-semibold text-white"
          >
            {dict.events.calendars.heroCta}
          </a>
        }
        media={
          <HeroPhotos
            layout={HERO_LAYOUT}
            photos={heroPhotos}
            sizes={HERO_SIZES}
            tileClassName="w-full rounded-md border border-line shadow-sm lg:aspect-auto"
            placeholderLabel={dict.events.photoLabel}
            preloadFirst
            className="grid w-full shrink-0 grid-cols-2 gap-3 lg:h-88 lg:w-136 lg:grid-cols-12 lg:grid-rows-12 lg:gap-3"
          />
        }
      />

      <PageSection
        id="upcoming"
        surface="azure"
        tight
        wide
        watermark="催"
        watermarkClassName="-top-20 -left-12 text-magenta/5"
        accent={dict.events.upcomingAccent}
        caption={dict.events.upcomingCaption}
        title={dict.events.upcomingTitle}
      >
        {upcoming.length > 0 ? (
          <>
            <div className="reveal-stagger-2-3 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {upcoming.slice(0, UPCOMING_PREVIEW).map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  badge={i === 0 ? dict.events.nextUpBadge : undefined}
                  withSignup
                  className="reveal-bloom"
                />
              ))}
            </div>
            <RevealMore
              moreLabel={dict.events.upcomingShowMore}
              lessLabel={dict.events.upcomingShowLess}
              more={
                upcoming.length > UPCOMING_PREVIEW ? (
                  <div className="reveal-stagger-2-3 mt-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {upcoming.slice(UPCOMING_PREVIEW).map((event, i) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        index={UPCOMING_PREVIEW + i}
                        withSignup
                        className="reveal-bloom"
                      />
                    ))}
                  </div>
                ) : undefined
              }
            >
              <a
                href="#calendars"
                className="link-arrow font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
              >
                {dict.events.calendars.sectionCta}
              </a>
            </RevealMore>
          </>
        ) : (
          <p className="rounded-2xl border border-line bg-white p-8 text-ink-soft">
            {dict.events.empty}
          </p>
        )}
      </PageSection>

      <PageSection
        id="calendars"
        surface="white"
        watermark="週"
        watermarkClassName="top-48 -right-16 text-indigo/5"
        accent={dict.events.calendars.accent}
        caption={dict.events.calendars.caption}
        title={dict.events.calendars.title}
        lede={dict.events.calendars.lede}
      >
        <div className="grid gap-6">
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
      </PageSection>

      {past.length > 0 && (
        <PageSection
          id="past"
          surface="mist"
          wide
          watermark="昔"
          watermarkClassName="-right-12 -bottom-20 text-indigo/5"
          accent={dict.events.pastAccent}
          caption={dict.events.pastCaption}
          title={dict.events.pastTitle}
        >
          <div className="reveal-stagger grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {past.slice(0, PAST_PREVIEW).map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                sizes={FOUR_UP_SIZES}
                className="reveal-bloom"
              />
            ))}
          </div>
          <RevealMore
            moreLabel={dict.events.pastShowMore}
            lessLabel={dict.events.pastShowLess}
            more={
              past.length > PAST_PREVIEW ? (
                <div className="reveal-stagger mt-5 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
                  {past.slice(PAST_PREVIEW).map((event, i) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={PAST_PREVIEW + i}
                      sizes={FOUR_UP_SIZES}
                      className="reveal-bloom"
                    />
                  ))}
                </div>
              ) : undefined
            }
          >
            <Link
              href={localePath(locale, "/events/past")}
              className="link-arrow font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
            >
              {dict.events.pastArchiveCta}
            </Link>
          </RevealMore>
        </PageSection>
      )}
    </>
  );
}
