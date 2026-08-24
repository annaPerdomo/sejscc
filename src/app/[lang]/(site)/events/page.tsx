import type { Metadata } from "next";
import { EventCard } from "@/components/event-card";
import { GoogleCalendar } from "@/components/google-calendar";
import { HeroPhotos } from "@/components/hero-photos";
import { PageHero } from "@/components/page-hero";
import { PageSection } from "@/components/page-section";
import { calendarSources } from "@/lib/calendars";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { photoFor, eventsHeroPhotos } from "@/lib/photos";

export const revalidate = 300;

const HERO_LAYOUT = [
  "col-span-2 aspect-photo sm:col-span-1 lg:col-start-1 lg:col-span-6 lg:row-start-1 lg:row-span-8",
  "aspect-square sm:aspect-photo lg:col-start-7 lg:col-span-6 lg:row-start-3 lg:row-span-6",
  "aspect-square sm:col-span-2 sm:aspect-band lg:col-start-1 lg:col-span-12 lg:row-start-9 lg:row-span-4",
];
const HERO_SIZES = [
  "(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 18rem",
  "(max-width: 640px) 46vw, (max-width: 1024px) 50vw, 18rem",
  "(max-width: 640px) 46vw, (max-width: 1024px) 100vw, 36rem",
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
    getPastEvents(6),
  ]);

  const heroPhotos = eventsHeroPhotos.map((src, i) =>
    photoFor(src, dict.events.heroPhotoAlts[i] ?? "")
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
        titleLine2={dict.events.titleLine2}
        lede={dict.events.lede}
        actions={
          <>
            {upcoming.length > 0 && (
              <a
                href="#upcoming"
                className="button-primary rounded-lg px-6 py-3.5 font-display text-sm font-semibold text-white"
              >
                {dict.events.upcomingCta}
              </a>
            )}
            <a
              href="#calendars"
              className="font-display text-sm font-semibold text-magenta hover:text-magenta-deep"
            >
              {dict.events.calendars.heroCta}
            </a>
            {past.length > 0 && (
              <a
                href="#past"
                className="font-display text-sm font-semibold text-magenta hover:text-magenta-deep"
              >
                {dict.events.pastCta}
              </a>
            )}
          </>
        }
        media={
          <HeroPhotos
            layout={HERO_LAYOUT}
            photos={heroPhotos}
            sizes={HERO_SIZES}
            tileClassName="w-full rounded-xl border border-line shadow-sm lg:aspect-auto"
            placeholderLabel={dict.events.photoLabel}
            preloadFirst
            className="grid w-full shrink-0 grid-cols-2 gap-3 lg:h-112 lg:w-120 lg:grid-cols-12 lg:grid-rows-12 lg:gap-4 xl:h-132 xl:w-144"
          />
        }
      />

      <PageSection
        id="upcoming"
        surface="white"
        watermark="暦"
        watermarkClassName="top-64 -left-16 text-indigo/5"
        accent={dict.events.upcomingAccent}
        caption={dict.events.upcomingCaption}
        title={dict.events.upcomingTitle}
      >
        {upcoming.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} className="reveal-rise" />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-line bg-mist p-8 text-ink-soft">
            {dict.events.empty}
          </p>
        )}
      </PageSection>

      <PageSection
        id="calendars"
        surface="mist"
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
          surface="white"
          watermark="昔"
          watermarkClassName="-right-12 -bottom-20 text-indigo/5"
          accent={dict.events.pastAccent}
          caption={dict.events.pastCaption}
          title={dict.events.pastTitle}
        >
          <div className="grid gap-5 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} className="reveal-rise" />
            ))}
          </div>
        </PageSection>
      )}
    </>
  );
}
