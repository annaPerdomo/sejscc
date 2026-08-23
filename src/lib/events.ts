import { cache } from "react";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, groups } from "@/db/schema";

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

/** Now, in the wall-clock-stored-as-UTC convention (see src/lib/format.ts). */
export function wallClockNow(): Date {
  const la = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
  });
  const [date, time] = la.split(", ");
  const [m, d, y] = date.split("/");
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${time}Z`);
}

export function getUpcomingEvents(limit?: number) {
  const query = db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), gte(events.startAt, wallClockNow())))
    .orderBy(asc(events.startAt));
  return failSoft(limit ? query.limit(limit) : query, []);
}

export function getPastEvents(limit = 12) {
  return failSoft(
    db
      .select()
      .from(events)
      .where(and(eq(events.status, "published"), lt(events.startAt, wallClockNow())))
      .orderBy(desc(events.startAt))
      .limit(limit),
    []
  );
}

export const getEventBySlug = cache(async (slug: string) => {
  const rows = await failSoft(
    db.select().from(events).where(eq(events.slug, slug)).limit(1),
    []
  );
  const event = rows[0];
  return event?.status === "published" ? event : null;
});

export function getUpcomingEventSlugs() {
  return failSoft(
    db
      .select({ slug: events.slug })
      .from(events)
      .where(and(eq(events.status, "published"), gte(events.startAt, wallClockNow()))),
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
