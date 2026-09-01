import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BrushEdge } from "@/components/brush-edge";
import { ExternalLink } from "@/components/external-link";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { SectionKicker } from "@/components/section-kicker";
import { eventCalendarUrl } from "@/lib/calendars";
import {
  CENTER_EMAIL,
  CENTER_PHONE,
  CENTER_PHONE_HREF,
  isAtCenter,
  mapsUrl,
} from "@/lib/center";
import { getEventBySlug, getUpcomingEventSlugs } from "@/lib/events";
import { getImageSize } from "@/lib/image-size";
import {
  formatEventDate,
  formatEventTime,
  wallClockNow,
} from "@/lib/format";
import {
  describeRepeat,
  latestOccurrence,
  occurrenceEnd,
  upcomingOccurrences,
} from "@/lib/recurrence";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";

export const revalidate = 300;

const DATES_SHOWN = 5;

// Prerendering only upcoming events keeps builds bounded; past ones render on demand.
export async function generateStaticParams() {
  const rows = await getUpcomingEventSlugs();
  return rows.map(({ slug }) => ({ slug }));
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  const event = await getEventBySlug(slug);
  if (!event) return { title: dict.eventDetail.notFound };
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? undefined,
    alternates: {
      canonical: localePath(lang, `/events/${slug}`),
      languages: {
        en: `/events/${slug}`,
        ja: `/ja/events/${slug}`,
        "x-default": `/events/${slug}`,
      },
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const [lang, dict, event] = await Promise.all([
    getLocale(),
    getDictionary(),
    getEventBySlug(slug),
  ]);
  if (!event) notFound();

  const flyerSize = event.flyerUrl ? await getImageSize(event.flyerUrl) : null;
  const now = wallClockNow();
  const nextDates = upcomingOccurrences(event, now, DATES_SHOWN);
  // Lists file a finished series under its last date, so this page has to agree.
  const start = nextDates[0] ?? latestOccurrence(event, now) ?? event.startAt;
  const end = start ? occurrenceEnd(event, start) : null;
  const repeat = describeRepeat(event, dict.events.repeat, lang);
  const facts: { label: string; value: ReactNode }[] = [
    {
      label:
        repeat && nextDates.length > 0
          ? dict.eventDetail.nextDate
          : dict.eventDetail.date,
      value: formatEventDate(start, lang),
    },
    {
      label: dict.eventDetail.time,
      value: formatEventTime(start, end, lang),
    },
    { label: dict.eventDetail.repeats, value: repeat },
    {
      label: dict.eventDetail.where,
      value: event.location && (
        <ExternalLink
          href={mapsUrl(event.location)}
          aria-label={`${event.location} — ${dict.eventDetail.directions}`}
          className="underline decoration-sky/60 underline-offset-4 hover:decoration-sky"
        >
          {event.location}
        </ExternalLink>
      ),
    },
  ].filter((fact) => fact.value);

  // A sign-up link on a finished event points at a closed form.
  const signupUrl =
    event.signupUrl && (nextDates.length > 0 || !event.startAt)
      ? event.signupUrl
      : null;
  // The .ics route derives the same occurrence, so both paths add the same date.
  const googleCalendarUrl =
    nextDates.length > 0
      ? eventCalendarUrl({
          title: event.title,
          start: nextDates[0],
          end: occurrenceEnd(event, nextDates[0]),
          details: event.description,
          location: event.location,
        })
      : null;

  const backLink = (className: string) => (
    <Link
      href={localePath(lang, "/events")}
      className={`font-display text-sm font-semibold ${className}`}
    >
      {dict.eventDetail.back}
    </Link>
  );

  return (
    <>
      <section className="section-navy-scene relative overflow-clip text-white">
        <KanjiWatermark char="祭" className="-right-12 -bottom-10 text-white/5" />
        <div className="relative mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 sm:pt-7 sm:pb-14">
          <div className="reveal-rise flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            {backLink("text-sky hover:text-white")}
            <SectionKicker
              accent={dict.eventDetail.kickerAccent}
              caption={dict.eventDetail.kickerCaption}
              tone="sky"
              order="caption-first"
            />
          </div>
          <h1 className="reveal-rise mt-4 font-display text-4xl leading-tight font-normal tracking-[0.02em] text-white sm:text-5xl">
            {event.title}
          </h1>
          <span
            aria-hidden="true"
            className="reveal-rise mt-4 block h-0.5 w-9 bg-indigo"
          />
          {facts.length > 0 && (
            <dl className="reveal-rise mt-6 flex flex-wrap gap-x-10 gap-y-5">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-display text-xs font-semibold tracking-[0.16em] text-sky uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-1.5 text-base text-white">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {nextDates.length > 1 && (
            <div className="reveal-rise mt-7">
              <h2 className="font-display text-xs font-semibold tracking-[0.16em] text-sky uppercase">
                {dict.eventDetail.upcomingDates}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {nextDates.slice(1).map((occurrence) => (
                  <li
                    key={occurrence.toISOString()}
                    className="rounded-lg border border-sky/40 bg-white/10 px-3.5 py-2 font-display text-sm font-semibold text-white"
                  >
                    {formatEventDate(occurrence, lang)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <BrushEdge
          id="event-detail"
          variant="ink"
          className="absolute inset-x-0 bottom-0"
        />
      </section>

      <section className="relative overflow-clip bg-mist py-10 sm:py-12">
        <KanjiWatermark char="縁" className="-right-14 -bottom-20 text-indigo/5" />
        <div
          className={`relative mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:items-start lg:gap-x-16 ${
            event.flyerUrl
              ? "lg:grid-cols-[1fr_36rem] lg:grid-rows-[auto_1fr]"
              : ""
          }`}
        >
          <div className="lg:col-start-1 lg:row-start-1">
            {event.description && (
              <div className="reveal-rise max-w-2xl">
                <SectionKicker
                  accent={dict.eventDetail.aboutAccent}
                  caption={dict.eventDetail.aboutCaption}
                />
                <div className="mt-5 leading-relaxed whitespace-pre-line text-ink-soft">
                  {event.description}
                </div>
              </div>
            )}

            {signupUrl && (
              <div className="reveal-rise mt-8">
                <ExternalLink
                  href={signupUrl}
                  className="button-primary inline-block rounded-lg px-7 py-3.5 font-display text-sm font-semibold text-white"
                >
                  {dict.eventDetail.signUp}
                </ExternalLink>
              </div>
            )}

            {googleCalendarUrl && (
              <div className="reveal-rise mt-8">
                <h2 className="font-display text-xs font-semibold tracking-[0.16em] text-ink-soft uppercase">
                  {dict.eventDetail.addToCalendar}
                </h2>
                <div className="mt-3 flex flex-wrap gap-3">
                  <ExternalLink
                    href={googleCalendarUrl}
                    className="button-outline px-6 py-3 font-display text-sm font-semibold"
                  >
                    {dict.eventDetail.calendarGoogle}
                  </ExternalLink>
                  <a
                    href={`/api/events/${event.slug}/calendar.ics`}
                    className="button-outline px-6 py-3 font-display text-sm font-semibold"
                  >
                    {dict.eventDetail.calendarDownload}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* In source order between the copy blocks so it sits mid-page on a phone. */}
          {event.flyerUrl && (
            <div className="reveal-rise lg:col-start-2 lg:row-span-2 lg:row-start-1">
              {/* Flyers arrive portrait and landscape, so no fixed aspect box:
                  measured dimensions let a height and a width cap apply at once,
                  and an unmeasured flyer fills the width rather than squashing. */}
              <Image
                src={event.flyerUrl}
                alt={dict.eventDetail.flyerAlt.replace("{title}", event.title)}
                width={flyerSize?.width ?? 800}
                height={flyerSize?.height ?? 1000}
                sizes="(max-width: 1023px) 100vw, 36rem"
                className={`mx-auto h-auto shadow-2xl ring-1 ring-ink/10 ${
                  flyerSize ? "w-auto max-w-full lg:max-h-132" : "w-full"
                }`}
                preload
              />
              {event.flyerDownloadUrl && (
                <a
                  href={event.flyerDownloadUrl}
                  download
                  className="button-outline mx-auto mt-8 block w-fit px-6 py-3 font-display text-sm font-semibold"
                >
                  {dict.eventDetail.downloadFlyer}
                </a>
              )}
            </div>
          )}

          <div className="lg:col-start-1 lg:row-start-2">
            <div className="reveal-rise grid gap-7 border-t border-line pt-8 sm:grid-cols-2">
              <div>
                <h2 className="font-display text-xs font-semibold tracking-[0.16em] text-ink-soft uppercase">
                  {dict.eventDetail.questions}
                </h2>
                <p className="mt-2 leading-relaxed">
                  <a
                    href={CENTER_PHONE_HREF}
                    className="text-indigo hover:text-indigo-deep"
                  >
                    {CENTER_PHONE}
                  </a>
                  <br />
                  <a
                    href={`mailto:${CENTER_EMAIL}`}
                    className="text-indigo hover:text-indigo-deep"
                  >
                    {CENTER_EMAIL}
                  </a>
                </p>
              </div>
              {isAtCenter(event.location) && (
                <div>
                  <h2 className="font-display text-xs font-semibold tracking-[0.16em] text-ink-soft uppercase">
                    {dict.eventDetail.parking}
                  </h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">
                    {dict.eventDetail.parkingBody}
                  </p>
                </div>
              )}
            </div>

            <div className="reveal-rise mt-10">
              {backLink("text-indigo hover:text-indigo-deep")}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
