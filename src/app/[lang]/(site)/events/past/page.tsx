import type { Metadata } from "next";
import Link from "next/link";
import { EventCard, FOUR_UP_SIZES } from "@/components/event-card";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PageHero } from "@/components/page-hero";
import { getPastEvents, type Event } from "@/lib/events";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";

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
      <PageHero
        id="past-events"
        wash="section-wash-events-hero"
        watermark="昔"
        watermarkClassName="-right-14 -bottom-24 text-indigo/5"
        accent={dict.events.pastAccent}
        caption={dict.events.pastCaption}
        titleLine1={archive.titleLine1}
        titleLine2={archive.titleLine2}
        lede={archive.lede}
        eyebrow={
          <Link
            href={localePath(lang, "/events")}
            className="font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
          >
            {dict.eventDetail.back}
          </Link>
        }
      />

      <section className="relative overflow-clip bg-white py-14 sm:py-16">
        <KanjiWatermark char="縁" className="-right-12 -bottom-20 text-indigo/5" />
        {years.length === 0 ? (
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <p className="rounded-2xl border border-line bg-mist p-8 text-ink-soft">
              {archive.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {years.map(([year, yearEvents]) => (
              <div key={year}>
                <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
                  <h2 className="reveal-rise border-b border-line pb-3 font-display text-2xl text-ink">
                    {archive.yearLabel.replace("{year}", String(year))}
                  </h2>
                </div>
                <div className="relative mx-auto mt-6 max-w-6xl px-4 sm:px-6 lg:max-w-wide">
                  <div className="reveal-stagger grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
                    {yearEvents.map((event, i) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        index={i}
                        sizes={FOUR_UP_SIZES}
                        className="reveal-bloom"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
