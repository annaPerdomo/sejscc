import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { GoogleCalendar } from "@/components/google-calendar";
import { PageHero } from "@/components/page-hero";
import { PageSection } from "@/components/page-section";
import { PastEventsReveal } from "@/components/past-events-reveal";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { SitePhoto } from "@/components/site-photo";
import { UpcomingEvents } from "@/components/upcoming-events";
import { calendarSources } from "@/lib/calendars";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { eventsHeroPhoto, photoFor } from "@/lib/photos";

export const revalidate = 300;

const PAST_PREVIEW = 4;

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
            <a
              href="#calendars"
              className="button-primary rounded-lg px-6 py-3.5 font-display text-sm font-semibold text-white"
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
          <SitePhoto
            photo={photoFor(eventsHeroPhoto, dict.events.heroPhotoAlt)}
            preload
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 26rem"
            placeholderLabel={dict.events.photoLabel}
            className="reveal-rise aspect-photo w-full rounded-xl border border-line shadow-sm lg:w-96 xl:w-104"
          />
        }
        below={
          <>
            <div className="mb-7">
              <SectionKicker
                accent={dict.events.upcomingAccent}
                caption={dict.events.upcomingCaption}
              />
              <SectionHeading className="mt-3">
                {dict.events.upcomingTitle}
              </SectionHeading>
            </div>
            {upcoming.length > 0 ? (
              <UpcomingEvents events={upcoming} />
            ) : (
              <p className="rounded-2xl border border-line bg-white p-8 text-ink-soft">
                {dict.events.empty}
              </p>
            )}
          </>
        }
      />

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
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {past.slice(0, PAST_PREVIEW).map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                index={i}
                className="reveal-rise"
              />
            ))}
          </div>
          <PastEventsReveal
            moreLabel={dict.events.pastShowMore}
            lessLabel={dict.events.pastShowLess}
            more={
              past.length > PAST_PREVIEW ? (
                <div className="mt-5 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
                  {past.slice(PAST_PREVIEW).map((event, i) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={PAST_PREVIEW + i}
                      className="reveal-rise"
                    />
                  ))}
                </div>
              ) : undefined
            }
          >
            <Link
              href={localePath(locale, "/events/past")}
              className="font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
            >
              {dict.events.pastArchiveCta}
            </Link>
          </PastEventsReveal>
        </PageSection>
      )}
    </>
  );
}
