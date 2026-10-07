import type { Metadata } from "next";
import Link from "next/link";
import { EventPoster } from "@/components/event-poster";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PhotoHero } from "@/components/photo-hero";
import { getPastEvents, type Event } from "@/lib/events";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { eventsPhotos } from "@/lib/photos";

export const revalidate = 300;

// A few dozen events a year, so one page holds many years of them.
const ARCHIVE_LIMIT = 200;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.events.archive.metaTitle,
    description: dict.events.archive.metaDescription,
    alternates: {
      canonical: localePath(lang, "/events/past"),
      languages: {
        en: "/events/past",
        ja: "/ja/events/past",
        "x-default": "/events/past",
      },
    },
  };
}

// Years come out newest first only because getPastEvents sorted the list that
// way. Dates are wall clock behind a fake UTC marker, so the year reads in UTC.
function groupByYear(events: Event[]) {
  const years = new Map<number, Event[]>();
  for (const event of events) {
    if (!event.startAt) continue;
    const year = event.startAt.getUTCFullYear();
    years.set(year, [...(years.get(year) ?? []), event]);
  }
  return [...years.entries()];
}

export default async function PastEventsPage() {
  const [lang, dict, past] = await Promise.all([
    getLocale(),
    getDictionary(),
    getPastEvents(ARCHIVE_LIMIT),
  ]);
  const archive = dict.events.archive;
  const years = groupByYear(past);

  return (
    <>
      <PhotoHero
        id="past-events"
        photo={eventsPhotos.archive}
        photoAlt={archive.heroPhotoAlt}
        accent={dict.events.pastAccent}
        caption={dict.events.pastCaption}
        titleLine1={archive.titleLine1}
        titleLine2={archive.titleLine2}
        lede={<p>{archive.lede}</p>}
        settlesInto="mist"
        eyebrow={
          <Link
            href={localePath(lang, "/events")}
            className="inline-block py-2 font-display text-base font-semibold text-sky hover:text-white"
          >
            {dict.eventDetail.back}
          </Link>
        }
      />

      <section className="relative overflow-clip bg-mist pt-10 pb-20 sm:pt-14 sm:pb-28">
        <KanjiWatermark char="縁" className="-right-12 bottom-20 text-indigo/5" />
        <div className="relative mx-auto max-w-wide px-5 sm:px-10 lg:px-16">
          {years.length === 0 ? (
            <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">{archive.empty}</p>
          ) : (
            <div className="flex flex-col gap-24">
              {years.map(([year, yearEvents]) => (
                <div key={year} className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                  <div className="lg:col-span-3">
                    <h2 className="ink-bleed border-b-4 border-magenta pb-3 font-display text-6xl leading-none font-light text-indigo-deep lg:sticky lg:top-36 lg:border-b-0 lg:border-l-4 lg:pb-0 lg:pl-6 xl:text-8xl">
                      {archive.yearLabel.replace("{year}", String(year))}
                    </h2>
                  </div>
                  <div className="reveal-stagger-2-3 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3 2xl:grid-cols-4">
                    {yearEvents.map((event, i) => (
                      <div key={event.id} className="reveal-bloom">
                        <EventPoster event={event} index={i} variant="compact" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
