import type { Metadata } from "next";
import { DatePage } from "@/components/date-page";
import { ExternalLink } from "@/components/external-link";
import { FacilityCalendar, type CalendarCell } from "@/components/facility-calendar";
import { GoogleCalendar } from "@/components/google-calendar";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PhotoHero } from "@/components/photo-hero";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { TodayAtCenter } from "@/components/today-at-center";
import {
  bookingsByDay,
  dayKey,
  getCalendarFeed,
  nextDayWithBookings,
  startOfDay,
  upcomingDates,
} from "@/lib/calendar-feed";
import { calendarSources, calendarSubscribeUrl } from "@/lib/calendars";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import {
  formatEventDay,
  formatEventMonth,
  formatLongDay,
  formatMonthYear,
  formatShortEventDate,
  formatShortWeekday,
  formatWeekday,
  wallClockNow,
} from "@/lib/format";
import { hasLocale, localePath } from "@/lib/i18n";
import { eventsPhotos } from "@/lib/photos";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS_BACK = 12;
const MONTHS_AHEAD = 18;
const DATES_SHOWN = 8;
const NEXT_DAY_SEARCH_DAYS = 60;
const DATES_WINDOW_DAYS = 366;
const A_SUNDAY = Date.UTC(2023, 0, 1);

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ month?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.events.calendars.metaTitle,
    description: dict.events.calendars.metaDescription,
    alternates: {
      canonical: localePath(lang, "/calendar"),
      languages: {
        en: "/calendar",
        ja: "/ja/calendar",
        "x-default": "/calendar",
      },
    },
  };
}

function monthIndex(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function monthStart(index: number): Date {
  return new Date(Date.UTC(Math.floor(index / 12), index % 12, 1));
}

function monthParam(index: number): string {
  return monthStart(index).toISOString().slice(0, 7);
}

function requestedMonth(raw: string | string[] | undefined, current: number): number {
  const match = typeof raw === "string" ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw) : null;
  if (!match) return current;
  const index = Number(match[1]) * 12 + Number(match[2]) - 1;
  return Math.min(Math.max(index, current - MONTHS_BACK), current + MONTHS_AHEAD);
}

export default async function CalendarPage({ searchParams }: Props) {
  const [facilitiesSource, datesSource] = calendarSources;
  const [dict, locale, photos, facilities, dates, { month: rawMonth }] = await Promise.all([
    getDictionary(),
    getLocale(),
    getSitePhotos(),
    getCalendarFeed(facilitiesSource.calendarId),
    getCalendarFeed(datesSource.calendarId),
    searchParams,
  ]);
  const copy = dict.events.calendars;
  const heroPhotos = eventsPhotos.calendarReel.map((_src, i) =>
    slotPhoto(photos, `events.calendar.${i}`, copy.reel.photos[i]?.alt ?? "", locale),
  );

  const today = startOfDay(wallClockNow());
  const todayKey = dayKey(today);
  const currentMonth = monthIndex(today);
  const shownMonth = requestedMonth(rawMonth, currentMonth);
  const from = monthStart(shownMonth);
  const before = monthStart(shownMonth + 1);
  const monthHref = (index: number) =>
    localePath(locale, index === currentMonth ? "/calendar" : `/calendar?month=${monthParam(index)}`);

  const todaysBookings = facilities
    ? (bookingsByDay(facilities, today, new Date(today.getTime() + DAY_MS), locale).get(todayKey) ??
      [])
    : [];
  const nextDay =
    facilities && todaysBookings.length === 0
      ? nextDayWithBookings(facilities, today, NEXT_DAY_SEARCH_DAYS, locale)
      : null;

  const monthBookings = facilities ? bookingsByDay(facilities, from, before, locale) : null;
  const cells: (CalendarCell | null)[] = Array.from({ length: from.getUTCDay() }, () => null);
  for (let day = from; day < before; day = new Date(day.getTime() + DAY_MS)) {
    const key = dayKey(day);
    cells.push({
      key,
      day: day.getUTCDate(),
      label: formatLongDay(day, locale),
      bookings: monthBookings?.get(key) ?? [],
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, row) =>
    cells.slice(row * 7, row * 7 + 7),
  );
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(A_SUNDAY + i * DAY_MS);
    return { short: formatShortWeekday(day, locale), long: formatWeekday(day, locale) };
  });

  const schoolDates = dates
    ? upcomingDates(
        dates,
        today,
        new Date(today.getTime() + DATES_WINDOW_DAYS * DAY_MS),
        DATES_SHOWN,
      )
    : null;

  return (
    <>
      <PhotoHero
        photo={heroPhotos[0].src}
        photoAlt={heroPhotos[0].alt}
        photoFraming={heroPhotos[0].framing}
        photos={heroPhotos}
        rotationLabels={{
          pause: copy.reel.pause,
          play: copy.reel.play,
          list: copy.reel.list,
          photo: copy.reel.photo,
        }}
        accent={copy.accent}
        caption={copy.caption}
        titleLine1={copy.pageTitleLine1}
        titleLine2={copy.pageTitleLine2}
        lede={
          facilities ? (
            <TodayAtCenter
              month={formatEventMonth(today, locale) ?? ""}
              day={formatEventDay(today, locale) ?? ""}
              weekday={formatWeekday(today, locale)}
              dateInWords={formatLongDay(today, locale)}
              bookings={todaysBookings}
              next={
                nextDay && {
                  dateInWords: formatLongDay(nextDay.day, locale),
                  bookings: nextDay.bookings,
                }
              }
              labels={{
                heading: copy.today.heading,
                none: copy.today.none,
                next: copy.today.next,
                allDay: copy.month.allDay,
              }}
            />
          ) : (
            <p>{copy.pageLede}</p>
          )
        }
        actions={
          <>
            <a href="#month" className="button-light px-7 py-4 text-base">
              {copy.monthCta}
            </a>
            <a
              href="#dates"
              className="link-arrow py-2 font-display text-lg font-semibold text-sky hover:text-white"
            >
              {copy.datesCta}
            </a>
          </>
        }
      />

      <section
        id="month"
        className="seigaiha-rings seigaiha-rings-fade relative scroll-mt-28 bg-paper pt-14 pb-20 sm:pt-16 sm:pb-24"
      >
        <div className="relative mx-auto max-w-wide px-5 sm:px-10 lg:px-16">
          {facilities ? (
            <>
              <div className="reveal-rise mb-8 max-w-3xl">
                <SectionKicker accent={copy.month.accent} caption={copy.month.caption} size="lg" />
                <SectionHeading className="mt-4 sm:text-5xl">{copy.facilities.label}</SectionHeading>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                  {copy.facilities.description}
                </p>
              </div>
              <FacilityCalendar
                key={shownMonth}
                monthLabel={formatMonthYear(from, locale)}
                weekdays={weekdays}
                weeks={weeks}
                todayKey={todayKey}
                initialKey={shownMonth === currentMonth ? todayKey : dayKey(from)}
                previousHref={
                  shownMonth > currentMonth - MONTHS_BACK ? monthHref(shownMonth - 1) : null
                }
                nextHref={
                  shownMonth < currentMonth + MONTHS_AHEAD ? monthHref(shownMonth + 1) : null
                }
                todayHref={shownMonth === currentMonth ? null : monthHref(currentMonth)}
                labels={copy.month}
                spaceLabels={copy.spaces}
              />
              <p className="mt-6">
                <ExternalLink
                  href={calendarSubscribeUrl(facilitiesSource.calendarId)}
                  className="link-arrow font-display text-base font-semibold text-indigo hover:text-indigo-deep"
                >
                  {copy.openLabel}
                </ExternalLink>
              </p>
            </>
          ) : (
            <GoogleCalendar
              source={facilitiesSource}
              locale={locale}
              label={copy.facilities.label}
              description={copy.facilities.description}
              frameTitle={copy.facilities.frameTitle}
              openLabel={copy.openLabel}
            />
          )}
        </div>
      </section>

      <section
        id="dates"
        className="relative scroll-mt-28 overflow-clip bg-azure pt-16 pb-20 sm:pt-20 sm:pb-28"
      >
        <KanjiWatermark char="暦" className="-top-6 -right-10 text-indigo/5" />
        <div className="relative mx-auto max-w-wide px-5 sm:px-10 lg:px-16">
          {schoolDates ? (
            <>
              <div className="reveal-rise mb-10 max-w-3xl">
                <SectionKicker
                  accent={copy.dates.accent}
                  caption={copy.dates.caption}
                  tone="tinted"
                  size="lg"
                />
                <SectionHeading className="mt-4 sm:text-5xl">
                  {copy.comingEvents.label}
                </SectionHeading>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                  {copy.comingEvents.description}
                </p>
              </div>
              {schoolDates.length === 0 ? (
                <p className="text-lg leading-relaxed text-ink-soft">{copy.dates.none}</p>
              ) : (
                <ul className="reveal-stagger grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                  {schoolDates.map((date) => {
                    const startInWords = formatShortEventDate(date.start, locale) ?? "";
                    const isRange = date.lastDay > date.start;
                    return (
                      <li
                        key={date.id}
                        className="reveal-bloom flex items-center gap-4 border-t border-ink/15 pt-6"
                      >
                        <DatePage
                          month={formatEventMonth(date.start, locale) ?? ""}
                          day={formatEventDay(date.start, locale) ?? ""}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="font-display text-xl leading-snug font-semibold text-pretty text-ink first-letter:uppercase">
                            {date.title}
                          </p>
                          <p className="mt-0.5 text-base text-ink-soft">
                            {isRange
                              ? copy.dates.range
                                  .replace("{start}", startInWords)
                                  .replace("{end}", formatShortEventDate(date.lastDay, locale) ?? "")
                              : startInWords}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-10">
                <ExternalLink
                  href={calendarSubscribeUrl(datesSource.calendarId)}
                  className="link-arrow font-display text-base font-semibold text-indigo hover:text-indigo-deep"
                >
                  {copy.openLabel}
                </ExternalLink>
              </p>
            </>
          ) : (
            <GoogleCalendar
              source={datesSource}
              locale={locale}
              label={copy.comingEvents.label}
              description={copy.comingEvents.description}
              frameTitle={copy.comingEvents.frameTitle}
              openLabel={copy.openLabel}
            />
          )}
        </div>
      </section>
    </>
  );
}
