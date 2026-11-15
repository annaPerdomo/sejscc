import { cache } from "react";
import { TIME_ZONE } from "@/lib/calendars";
import { spaceOf, type DayBooking } from "@/lib/calendar-spaces";
import { formatEventTime } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { occurrencesBetween, parseFeed, type Feed } from "@/lib/ics-reader";

const FEED_CACHE_SECONDS = 300;

// Runs while the calendar page renders: a stalled feed must fall back, not hang.
const FEED_TIMEOUT_MS = 5000;

// Next caches fetch bodies only under 2 MB; past that every view would refetch.
const MAX_FEED_CHARACTERS = 1_900_000;

const DAY_MS = 24 * 60 * 60 * 1000;

function feedUrl(calendarId: string) {
  return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
}

export const getCalendarFeed = cache(async (calendarId: string): Promise<Feed | null> => {
  try {
    const response = await fetch(feedUrl(calendarId), {
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
      next: { revalidate: FEED_CACHE_SECONDS },
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (text.length > MAX_FEED_CHARACTERS || !text.startsWith("BEGIN:VCALENDAR")) return null;
    return parseFeed(text, TIME_ZONE);
  } catch {
    return null;
  }
});

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfDay(date: Date): Date {
  return new Date(Math.floor(date.getTime() / DAY_MS) * DAY_MS);
}

// Board members mark notices with asterisks ("** No Japanese School **").
function cleanTitle(title: string): string {
  return title.replace(/^[*\s]+|[*\s]+$/g, "");
}

// A location is sometimes a video-call link, which is not a place to show.
function cleanLocation(location: string | null): string | null {
  if (!location || /^https?:\/\//i.test(location)) return null;
  return location;
}

/** The bookings on each day from `from` up to `before`, keyed by `dayKey`. */
export function bookingsByDay(
  feed: Feed,
  from: Date,
  before: Date,
  locale: Locale,
): Map<string, DayBooking[]> {
  const days = new Map<string, DayBooking[]>();

  for (const occurrence of occurrencesBetween(feed, from, before)) {
    const title = cleanTitle(occurrence.title);
    if (!title) continue;
    const location = cleanLocation(occurrence.location);
    const firstDay = startOfDay(occurrence.start);
    const lastMoment = Math.max(occurrence.start.getTime(), occurrence.end.getTime() - 1);

    for (let day = firstDay; day.getTime() <= lastMoment; day = new Date(day.getTime() + DAY_MS)) {
      if (day < from || day >= before) continue;
      const startsToday = day.getTime() === firstDay.getTime();
      const key = dayKey(day);
      const bookings = days.get(key) ?? [];
      bookings.push({
        id: `${occurrence.uid}:${occurrence.start.getTime()}:${key}`,
        title,
        time:
          occurrence.allDay || !startsToday
            ? null
            : formatEventTime(
                occurrence.start,
                occurrence.end > occurrence.start ? occurrence.end : null,
                locale,
              ),
        location,
        space: spaceOf(location),
      });
      days.set(key, bookings);
    }
  }

  for (const bookings of days.values()) {
    bookings.sort((a, b) => Number(b.time === null) - Number(a.time === null));
  }
  return days;
}

export function nextDayWithBookings(
  feed: Feed,
  after: Date,
  days: number,
  locale: Locale,
): { day: Date; bookings: DayBooking[] } | null {
  const from = new Date(after.getTime() + DAY_MS);
  const byDay = bookingsByDay(feed, from, new Date(from.getTime() + days * DAY_MS), locale);
  const [key] = [...byDay.keys()].sort();
  const bookings = key ? byDay.get(key) : undefined;
  return key && bookings ? { day: new Date(`${key}T00:00:00Z`), bookings } : null;
}

export type CalendarDate = {
  id: string;
  title: string;
  start: Date;
  /** The last day it covers; the same day as `start` for a one-day date. */
  lastDay: Date;
};

export function upcomingDates(feed: Feed, from: Date, before: Date, limit: number): CalendarDate[] {
  const dates: CalendarDate[] = [];

  for (const occurrence of occurrencesBetween(feed, from, before)) {
    const title = cleanTitle(occurrence.title);
    if (!title) continue;
    const start = startOfDay(occurrence.start);
    const lastDay = startOfDay(
      new Date(Math.max(occurrence.start.getTime(), occurrence.end.getTime() - 1)),
    );
    const previous = dates.findLast((date) => date.title.toLowerCase() === title.toLowerCase());
    if (previous && start.getTime() <= previous.lastDay.getTime() + DAY_MS) {
      if (lastDay > previous.lastDay) previous.lastDay = lastDay;
      continue;
    }
    dates.push({ id: `${occurrence.uid}:${occurrence.start.getTime()}`, title, start, lastDay });
  }

  return dates.slice(0, limit);
}
