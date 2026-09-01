import type { EventRepeat } from "@/db/schema";
import type { Dictionary } from "@/lib/dictionaries";
import { formatCalendarDate, formatWeekday } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

// Event times are LA wall clock behind a fake UTC marker (see src/lib/format.ts),
// so every step below is UTC arithmetic — a local getter would shift the date.

export type RepeatingEvent = {
  startAt: Date | null;
  endAt: Date | null;
  repeat: EventRepeat;
  repeatUntil: Date | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// A repeat with no end date runs forever, so every walk over a series is
// bounded. 2,000 weekly occurrences is about 38 years.
const MAX_OCCURRENCES = 2000;

function startOfDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Where a date's weekday falls in its month: Sept 6, 2025 → 1, the first Saturday. */
export function weekdayPosition(date: Date) {
  return Math.ceil(date.getUTCDate() / 7);
}

function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  position: number
) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const offset = (weekday - firstOfMonth.getUTCDay() + 7) % 7;
  const date = new Date(
    firstOfMonth.getTime() + (offset + (position - 1) * 7) * DAY_MS
  );
  return date.getUTCMonth() === firstOfMonth.getUTCMonth() ? date : null;
}

function* occurrenceStarts(event: RepeatingEvent): Generator<Date> {
  const { startAt, repeat, repeatUntil } = event;
  if (!startAt) return;
  if (repeat === "none") {
    yield startAt;
    return;
  }

  const lastDay = repeatUntil ? startOfDay(repeatUntil) : null;

  if (repeat === "monthly") {
    const weekday = startAt.getUTCDay();
    const position = weekdayPosition(startAt);
    const timeOfDay = startAt.getTime() - startOfDay(startAt);
    for (let month = 0; month < MAX_OCCURRENCES; month++) {
      const day = nthWeekday(
        startAt.getUTCFullYear(),
        startAt.getUTCMonth() + month,
        weekday,
        position
      );
      if (!day) continue;
      if (lastDay !== null && day.getTime() > lastDay) return;
      yield new Date(day.getTime() + timeOfDay);
    }
    return;
  }

  const step = (repeat === "weekly" ? 7 : 14) * DAY_MS;
  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    const start = new Date(startAt.getTime() + i * step);
    if (lastDay !== null && startOfDay(start) > lastDay) return;
    yield start;
  }
}

/** Occurrence starts on or after `from`, soonest first. */
export function upcomingOccurrences(
  event: RepeatingEvent,
  from: Date,
  limit: number
): Date[] {
  const starts: Date[] = [];
  if (limit < 1) return starts;
  for (const start of occurrenceStarts(event)) {
    if (start < from) continue;
    starts.push(start);
    if (starts.length === limit) break;
  }
  return starts;
}

export function latestOccurrence(
  event: RepeatingEvent,
  before: Date
): Date | null {
  let latest: Date | null = null;
  for (const start of occurrenceStarts(event)) {
    if (start >= before) break;
    latest = start;
  }
  return latest;
}

export function occurrenceEnd(event: RepeatingEvent, start: Date): Date | null {
  if (!event.startAt || !event.endAt) return null;
  return new Date(start.getTime() + (event.endAt.getTime() - event.startAt.getTime()));
}

export type RepeatPhrases = Dictionary["events"]["repeat"];

export function describeRepeat(
  event: RepeatingEvent,
  dict: RepeatPhrases,
  locale: Locale = "en"
): string | null {
  const { startAt, repeat } = event;
  if (!startAt || repeat === "none") return null;

  const weekday = formatWeekday(startAt, locale);
  let schedule: string;
  if (repeat === "monthly") {
    // ordinals is translator-edited JSON typed as string[], so a missing entry
    // is a runtime "undefined" here rather than a compile error.
    const ordinal = dict.ordinals[weekdayPosition(startAt) - 1];
    if (!ordinal) return null;
    schedule = dict.monthly
      .replace("{ordinal}", ordinal)
      .replace("{weekday}", weekday);
  } else {
    schedule = dict[repeat].replace("{weekday}", weekday);
  }

  const until = formatCalendarDate(event.repeatUntil, locale);
  return until
    ? dict.until.replace("{schedule}", schedule).replace("{date}", until)
    : schedule;
}
