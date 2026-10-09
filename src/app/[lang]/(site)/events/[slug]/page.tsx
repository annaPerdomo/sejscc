import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AddToCalendar } from "@/components/add-to-calendar";
import { DatePage } from "@/components/date-page";
import { ExternalLink } from "@/components/external-link";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { SectionKicker } from "@/components/section-kicker";
import { WaveDivider } from "@/components/wave-divider";
import { calendarLinks, calendarOptions } from "@/lib/calendars";
import { isAtCenter, mapsUrl } from "@/lib/center";
import { getEventBySlug, getUpcomingEventSlugs } from "@/lib/events";
import { getImageSize } from "@/lib/image-size";
import {
  formatEventDate,
  formatEventDay,
  formatEventMonth,
  formatEventTime,
  formatWeekday,
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
import { getCenterContact } from "@/lib/site-settings";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";

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
  const [lang, dict, event, contact, photos] = await Promise.all([
    getLocale(),
    getDictionary(),
    getEventBySlug(slug),
    getCenterContact(),
    getSitePhotos(),
  ]);
  if (!event) notFound();

  const flyerSize = event.flyerUrl ? await getImageSize(event.flyerUrl) : null;
  const backdropSrc = slotPhoto(photos, "home.events-backdrop", "", lang).src;
  const now = wallClockNow();
  const nextDates = upcomingOccurrences(event, now, DATES_SHOWN);
  // Lists file a finished series under its last date, so this page has to agree.
  const start = nextDates[0] ?? latestOccurrence(event, now) ?? event.startAt;
  const end = start ? occurrenceEnd(event, start) : null;
  const repeat = describeRepeat(event, dict.events.repeat, lang);
  const facts: { emoji: string; label: string; value: ReactNode }[] = [
    {
      emoji: "📅",
      label:
        repeat && nextDates.length > 0
          ? dict.eventDetail.nextDate
          : dict.eventDetail.date,
      value: formatEventDate(start, lang),
    },
    {
      emoji: "🕒",
      label: dict.eventDetail.time,
      value: formatEventTime(start, end, lang),
    },
    { emoji: "🔁", label: dict.eventDetail.repeats, value: repeat },
    {
      emoji: "📍",
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
  // The .ics route derives the same occurrence, so every option adds the same date.
  const calendar =
    nextDates.length > 0
      ? calendarOptions(
          calendarLinks({
            slug: event.slug,
            title: event.title,
            start: nextDates[0],
            end: occurrenceEnd(event, nextDates[0]),
            details: event.description,
            location: event.location,
          }),
          dict.calendar,
        )
      : null;

  const backLink = (className: string) => (
    <Link
      href={localePath(lang, "/events")}
      className={`inline-block py-2 font-display text-base font-semibold ${className}`}
    >
      {dict.eventDetail.back}
    </Link>
  );

  const month = formatEventMonth(start, lang);
  const day = formatEventDay(start, lang);

  return (
    <>
      <section className="edge-flush relative isolate overflow-clip bg-ink-deep text-white">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src={event.flyerUrl ?? backdropSrc}
            alt=""
            fill
            sizes="50vw"
            className="scale-125 object-cover blur-2xl"
          />
          {/* The flyer's own colors glow through; at this strength every
              text color here keeps AA over the brightest flyer. */}
          <div className="absolute inset-0 bg-gradient-to-br from-ink-deep/95 via-navy/90 to-ink-deep/85" />
        </div>
        <KanjiWatermark char="祭" className="-right-12 -bottom-10 text-white/5" />

        <div
          className={`relative mx-auto grid max-w-wide gap-12 px-5 pt-8 pb-28 sm:px-10 sm:pb-36 lg:items-center lg:px-16 ${
            event.flyerUrl ? "lg:grid-cols-12 lg:gap-14" : ""
          }`}
        >
          <div className={`enter-stagger ${event.flyerUrl ? "lg:col-span-7" : "max-w-4xl"}`}>
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
              {backLink("text-sky hover:text-white")}
              <SectionKicker
                accent={dict.eventDetail.kickerAccent}
                caption={dict.eventDetail.kickerCaption}
                tone="photo"
                order="caption-first"
                entrance="load"
              />
            </div>
            <h1 className="mt-8 font-display text-4xl leading-tight font-normal text-balance sm:text-5xl xl:text-6xl">
              {event.title}
            </h1>
            <div className="mt-9 flex items-start gap-6 sm:gap-8">
              {month && day && (
                <DatePage
                  month={month}
                  day={day}
                  weekday={start ? formatWeekday(start, lang) : null}
                  size="lg"
                />
              )}
              {facts.length > 0 && (
                <dl className="flex flex-col gap-4">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex items-start gap-3">
                      <dt className="w-8 shrink-0 text-center text-2xl leading-none">
                        <span aria-hidden="true">{fact.emoji}</span>
                        <span className="sr-only">{fact.label}</span>
                      </dt>
                      <dd className="text-lg leading-snug text-white sm:text-xl">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {nextDates.length > 1 && (
              <div className="mt-10">
                <h2 className="font-display text-sm font-semibold tracking-[0.18em] text-sky uppercase">
                  {dict.eventDetail.upcomingDates}
                </h2>
                <ul className="mt-4 flex flex-wrap gap-4">
                  {nextDates.slice(1).map((occurrence) => (
                    <li key={occurrence.toISOString()}>
                      <DatePage
                        month={formatEventMonth(occurrence, lang) ?? ""}
                        day={formatEventDay(occurrence, lang) ?? ""}
                      />
                      <span className="sr-only">{formatEventDate(occurrence, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(signupUrl || calendar) && (
              <div className="relative z-20 mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {signupUrl && (
                  <ExternalLink href={signupUrl} className="button-light px-7 py-4 text-center text-base">
                    {dict.eventDetail.signUp}
                  </ExternalLink>
                )}
                {calendar && (
                  <AddToCalendar
                    tone="dark"
                    placement="above"
                    label={dict.calendar.addToCalendar}
                    menuLabel={dict.calendar.chooseCalendar}
                    options={calendar}
                  />
                )}
              </div>
            )}
          </div>

          {event.flyerUrl && (
            <div className="enter-rise flex flex-col items-center lg:col-span-5">
              {/* Flyers arrive portrait and landscape, so no fixed aspect box:
                  measured dimensions let a height and a width cap apply at once,
                  and an unmeasured flyer fills the width rather than squashing. */}
              <div className="flyer-mount seigaiha-rings seigaiha-rings-gold w-fit max-w-full">
                <Image
                  src={event.flyerUrl}
                  alt={dict.eventDetail.flyerAlt.replace("{title}", event.title)}
                  width={flyerSize?.width ?? 800}
                  height={flyerSize?.height ?? 1000}
                  sizes="(max-width: 1023px) 100vw, 36rem"
                  className={`relative h-auto ring-1 ring-ink/10 ${
                    flyerSize ? "w-auto max-w-full lg:max-h-hero-flyer" : "w-full"
                  }`}
                  preload
                />
              </div>
              {event.flyerDownloadUrl && (
                <a
                  href={event.flyerDownloadUrl}
                  download
                  className="mt-8 rounded-lg border-2 border-white/70 px-6 py-3.5 font-display text-base font-semibold text-white hover:border-white hover:bg-white hover:text-navy"
                >
                  {dict.eventDetail.downloadFlyer}
                </a>
              )}
            </div>
          )}
        </div>
        <WaveDivider id="event-detail" seed={17} className="absolute inset-x-0 bottom-0 text-paper" />
      </section>

      <section className="seigaiha-rings seigaiha-rings-fade relative bg-paper pt-12 pb-20 sm:pt-16 sm:pb-24">
        <KanjiWatermark char="縁" className="-right-14 -bottom-20 text-indigo/5" />
        <div className="relative mx-auto grid max-w-wide gap-14 px-5 sm:px-10 lg:grid-cols-12 lg:px-16">
          {event.description && (
            <div className="reveal-rise lg:col-span-7">
              <SectionKicker
                accent={dict.eventDetail.aboutAccent}
                caption={dict.eventDetail.aboutCaption}
                size="lg"
              />
              <div className="mt-6 text-lg leading-relaxed whitespace-pre-line text-ink-soft sm:text-xl sm:leading-relaxed">
                {event.description}
              </div>
            </div>
          )}

          <div
            className={`reveal-rise flex flex-col gap-10 ${
              event.description ? "lg:col-span-4 lg:col-start-9" : "lg:col-span-12 sm:flex-row"
            }`}
          >
            <div>
              <h2 className="font-display text-sm font-semibold tracking-[0.18em] text-ink-soft uppercase">
                {dict.eventDetail.questions}
              </h2>
              <p className="mt-3 flex flex-col gap-1 text-lg">
                <a href={contact.phoneHref} className="w-fit py-1 font-semibold text-indigo hover:text-indigo-deep">
                  {contact.phone}
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="w-fit py-1 font-semibold text-indigo hover:text-indigo-deep"
                >
                  {contact.email}
                </a>
              </p>
            </div>
            {isAtCenter(event.location) && (
              <div>
                <h2 className="font-display text-sm font-semibold tracking-[0.18em] text-ink-soft uppercase">
                  {dict.eventDetail.parking}
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                  {dict.eventDetail.parkingBody}
                </p>
              </div>
            )}
            <div>{backLink("text-indigo hover:text-indigo-deep")}</div>
          </div>
        </div>
      </section>
    </>
  );
}
