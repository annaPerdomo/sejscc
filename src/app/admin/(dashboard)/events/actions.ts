"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { eventRepeats, events, type EventRepeat } from "@/db/schema";
import { requireUser, revalidateSite } from "@/lib/admin";
import { normalizeWebsiteUrl, slugify } from "@/lib/format";

export type EventInput = {
  title: string;
  description: string;
  flyerUrl: string | null;
  flyerDownloadUrl: string | null;
  signupUrl: string;
  date: string; // "2025-07-26", or "" for undated
  startTime: string; // "16:00", or ""
  endTime: string; // "21:00", or ""
  repeat: EventRepeat;
  repeatUntil: string; // "2026-06-30", or "" for no end date
  location: string;
  status: "draft" | "published";
};

// The fake UTC marker is the storage convention; see src/lib/format.ts.
function toWallClock(date: string, time: string): Date | null {
  if (!date) return null;
  const value = new Date(`${date}T${time || "00:00"}:00Z`);
  return Number.isNaN(value.getTime()) ? null : value;
}

// The form guards these too, but a server action can be called directly.
function checkedRepeat(input: EventInput) {
  const repeat = eventRepeats.includes(input.repeat) ? input.repeat : "none";
  if (repeat === "none") return { repeat, repeatUntil: null };

  const firstDay = toWallClock(input.date, "");
  if (!firstDay) {
    throw new Error(
      "Give the event a date before choosing how often it repeats."
    );
  }
  const repeatUntil = toWallClock(input.repeatUntil, "");
  if (repeatUntil && repeatUntil < firstDay) {
    throw new Error("The last date can’t come before the event’s first date.");
  }
  return { repeat, repeatUntil };
}

function eventValues(input: EventInput, userId?: string) {
  const title = input.title.trim();
  if (!title) throw new Error("An event title is required.");
  return {
    title,
    description: input.description.trim() || null,
    flyerUrl: input.flyerUrl,
    flyerDownloadUrl: input.flyerDownloadUrl,
    signupUrl: normalizeWebsiteUrl(input.signupUrl, "sign-up link"),
    startAt: toWallClock(input.date, input.startTime),
    endAt: input.endTime ? toWallClock(input.date, input.endTime) : null,
    ...checkedRepeat(input),
    location: input.location.trim() || null,
    status: input.status,
    ...(userId ? { createdById: userId } : {}),
  };
}

export async function createEvent(input: EventInput) {
  const user = await requireUser();
  const slug = `${slugify(input.title) || "event"}-${crypto
    .randomUUID()
    .slice(0, 6)}`;
  await db.insert(events).values({ ...eventValues(input, user.id), slug });
  revalidateSite();
}

export async function updateEvent(id: string, input: EventInput) {
  await requireUser();
  const [existing] = await db.select().from(events).where(eq(events.id, id));
  if (!existing) throw new Error("Event not found.");
  await db.update(events).set(eventValues(input)).where(eq(events.id, id));
  revalidateSite();
}

export async function deleteEvent(id: string) {
  await requireUser();
  const [existing] = await db.select().from(events).where(eq(events.id, id));
  if (!existing) return;
  await db.delete(events).where(eq(events.id, id));

  // Best-effort cleanup of uploaded flyers; the event row is already gone.
  const blobs = [existing.flyerUrl, existing.flyerDownloadUrl].filter(
    (url): url is string => Boolean(url)
  );
  if (blobs.length) {
    try {
      await del(blobs);
    } catch (error) {
      console.error("Failed to delete flyer blobs:", error);
    }
  }

  revalidateSite();
}
