import { cache } from "react";
import { and, asc, eq, gte, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, groups } from "@/db/schema";
import { wallClockNow } from "@/lib/format";
import {
  latestOccurrence,
  occurrenceEnd,
  upcomingOccurrences,
} from "@/lib/recurrence";

export type Event = typeof events.$inferSelect;
export type Group = typeof groups.$inferSelect;

// Swallowing is deliberate: static generation must succeed before the database
// is provisioned, and an outage should degrade the site rather than crash it.
async function failSoft<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await query;
  } catch (error) {
    console.error("Database query failed:", error);
    return fallback;
  }
}

/** Midnight today, so a repeat ending today still counts as running today. */
function today(now: Date) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function stillRepeating(now: Date) {
  return and(
    ne(events.repeat, "none"),
    or(isNull(events.repeatUntil), gte(events.repeatUntil, today(now)))
  );
}

function atOccurrence(event: Event, start: Date): Event {
  return { ...event, startAt: start, endAt: occurrenceEnd(event, start) };
}

// Upcoming until it ends, not until it starts, so an occurrence in progress
// keeps its listing and its sign-up link. No end time means end of its day.
function stillRunningSince(event: Event, now: Date) {
  if (!event.startAt) return now;
  const span = event.endAt
    ? event.endAt.getTime() - event.startAt.getTime()
    : Date.UTC(
        event.startAt.getUTCFullYear(),
        event.startAt.getUTCMonth(),
        event.startAt.getUTCDate() + 1
      ) - event.startAt.getTime();
  return new Date(now.getTime() - Math.max(span, 0));
}

function notYetOver(now: Date) {
  return gte(
    sql`coalesce(${events.endAt}, ${events.startAt} + interval '1 day')`,
    now
  );
}

// Occurrence dates are only known in JS, so these two read every published
// event and sort in memory. The center posts a few dozen a year.
export const getUpcomingEvents = cache(async (limit?: number) => {
  const now = wallClockNow();
  const rows = await failSoft(
    db
      .select()
      .from(events)
      .where(
        and(
          eq(events.status, "published"),
          or(notYetOver(now), stillRepeating(now))
        )
      ),
    []
  );

  const upcoming = rows
    .flatMap((event) => {
      const [start] = upcomingOccurrences(
        event,
        stillRunningSince(event, now),
        1
      );
      return start ? [{ event, start }] : [];
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map(({ event, start }) => atOccurrence(event, start));

  return limit ? upcoming.slice(0, limit) : upcoming;
});

export const getPastEvents = cache(async (limit = 12) => {
  const now = wallClockNow();
  const rows = await failSoft(
    db
      .select()
      .from(events)
      .where(
        and(
          eq(events.status, "published"),
          lt(events.startAt, now),
          or(eq(events.repeat, "none"), isNotNull(events.repeatUntil))
        )
      ),
    []
  );

  // A series can run out of occurrences before its end date, so both lists ask
  // upcomingOccurrences — comparing repeatUntil makes an event vanish from both.
  return rows
    .flatMap((event) => {
      const since = stillRunningSince(event, now);
      if (upcomingOccurrences(event, since, 1).length > 0) return [];
      const start = latestOccurrence(event, since);
      return start ? [{ event, start }] : [];
    })
    .sort((a, b) => b.start.getTime() - a.start.getTime())
    .slice(0, limit)
    .map(({ event, start }) => atOccurrence(event, start));
});

export const getEventBySlug = cache(async (slug: string) => {
  const rows = await failSoft(
    db.select().from(events).where(eq(events.slug, slug)).limit(1),
    []
  );
  const event = rows[0];
  return event?.status === "published" ? event : null;
});

export function getUpcomingEventSlugs() {
  const now = wallClockNow();
  return failSoft(
    db
      .select({ slug: events.slug })
      .from(events)
      .where(
        and(
          eq(events.status, "published"),
          or(notYetOver(now), stillRepeating(now))
        )
      ),
    []
  );
}

// Alphabetical order would sort "cancelled" before "meeting", so the
// display order is spelled out explicitly instead.
const GROUP_STATUS_RANK = sql`case ${groups.status} when 'meeting' then 0 when 'paused' then 1 else 2 end`;

export function getActiveGroups() {
  return failSoft(
    db
      .select()
      .from(groups)
      .where(eq(groups.active, true))
      .orderBy(GROUP_STATUS_RANK, asc(groups.sortOrder), asc(groups.name)),
    []
  );
}
