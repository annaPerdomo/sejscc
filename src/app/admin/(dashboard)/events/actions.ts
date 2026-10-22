"use server";

import { del, put } from "@vercel/blob";
import { generateImage } from "ai";
import { count, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  eventRepeats,
  events,
  flyerArtDrafts,
  type EventRepeat,
} from "@/db/schema";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireUser, revalidateSite } from "@/lib/admin";
import {
  FLYER_ART_CHOICES,
  FLYER_ART_DAILY_LIMIT,
  FLYER_ART_MODEL,
  flyerArtPrompts,
} from "@/lib/flyer-art";
import {
  isUploadedFileUrl,
  normalizeUploadedFileUrl,
  normalizeWebsiteUrl,
  slugify,
} from "@/lib/format";
import { normalizeFlyerArtUrl } from "@/lib/flyer-templates";
import { isFlyerLayout, type FlyerLayout } from "@/lib/flyer-layouts";

export type EventInput = {
  title: string;
  description: string;
  flyerUrl: string | null;
  flyerDownloadUrl: string | null;
  flyerArtUrl: string | null;
  flyerLayout: FlyerLayout | null;
  flyerWordsX: number | null;
  flyerWordsY: number | null;
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
    throw new AdminError(
      "Give the event a date before choosing how often it repeats."
    );
  }
  const repeatUntil = toWallClock(input.repeatUntil, "");
  if (repeatUntil && repeatUntil < firstDay) {
    throw new AdminError("The last date can’t come before the event’s first date.");
  }
  return { repeat, repeatUntil };
}

function checkedFlyerStyle(input: EventInput, flyerArtUrl: string | null) {
  if (!flyerArtUrl) {
    return { flyerLayout: null, flyerWordsX: null, flyerWordsY: null };
  }
  if (input.flyerLayout !== null && !isFlyerLayout(input.flyerLayout)) {
    throw new AdminError("Pick one of the listed flyer layouts.");
  }
  const validCoordinate = (value: number | null) =>
    value === null ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100);
  if (!validCoordinate(input.flyerWordsX) || !validCoordinate(input.flyerWordsY)) {
    throw new AdminError("The words’ position must be between 0 and 100.");
  }
  return {
    flyerLayout: input.flyerLayout,
    flyerWordsX: input.flyerWordsX,
    flyerWordsY: input.flyerWordsY,
  };
}

function eventValues(input: EventInput, userId?: string) {
  const title = input.title.trim();
  if (!title) throw new AdminError("An event title is required.");
  const flyerArtUrl = normalizeFlyerArtUrl(input.flyerArtUrl);
  return {
    title,
    description: input.description.trim() || null,
    flyerUrl: normalizeUploadedFileUrl(input.flyerUrl, "flyer"),
    flyerDownloadUrl: normalizeUploadedFileUrl(input.flyerDownloadUrl, "flyer"),
    flyerArtUrl,
    ...checkedFlyerStyle(input, flyerArtUrl),
    signupUrl: normalizeWebsiteUrl(input.signupUrl, "sign-up link"),
    startAt: toWallClock(input.date, input.startTime),
    endAt: input.endTime ? toWallClock(input.date, input.endTime) : null,
    ...checkedRepeat(input),
    location: input.location.trim() || null,
    status: input.status,
    ...(userId ? { createdById: userId } : {}),
  };
}

function blobUrls(urls: (string | null)[]): string[] {
  return [
    ...new Set(urls.filter((url): url is string => url !== null && isUploadedFileUrl(url))),
  ];
}

export async function createEvent(input: EventInput): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser();
    const slug = `${slugify(input.title) || "event"}-${crypto
      .randomUUID()
      .slice(0, 6)}`;
    await db.insert(events).values({ ...eventValues(input, user.id), slug });
    revalidateSite();
  });
}

export async function updateEvent(id: string, input: EventInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const [existing] = await db.select().from(events).where(eq(events.id, id));
    if (!existing) throw new AdminError("Event not found.");
    const values = eventValues(input);
    await db.update(events).set(values).where(eq(events.id, id));

    // Best-effort cleanup of flyers this update dropped or replaced.
    const kept = new Set([
      values.flyerUrl,
      values.flyerDownloadUrl,
      values.flyerArtUrl,
    ]);
    const orphans = blobUrls(
      [existing.flyerUrl, existing.flyerDownloadUrl, existing.flyerArtUrl].filter(
        (url) => !kept.has(url)
      )
    );
    if (orphans.length) {
      try {
        await del(orphans);
      } catch (error) {
        console.error("Failed to delete flyer blobs:", error);
      }
    }

    revalidateSite();
  });
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const [existing] = await db.select().from(events).where(eq(events.id, id));
    if (!existing) return;
    await db.delete(events).where(eq(events.id, id));

    // Best-effort cleanup of uploaded flyers; the event row is already gone.
    const blobs = blobUrls([
      existing.flyerUrl,
      existing.flyerDownloadUrl,
      existing.flyerArtUrl,
    ]);
    if (blobs.length) {
      try {
        await del(blobs);
      } catch (error) {
        console.error("Failed to delete flyer blobs:", error);
      }
    }

    revalidateSite();
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;
const UNKEPT_ART_LIFETIME_MS = 7 * DAY_MS;
const RESERVED_PREFIX = "reserved:";

export type FlyerArtInput = {
  title: string;
  description: string;
  date: string;
  idea: string;
  themeId: string;
};

export async function generateFlyerArt(
  input: FlyerArtInput
): Promise<ActionResult<string[]>> {
  return runAction(async () => {
    const user = await requireUser();
    const title = input.title.trim();
    if (!title) {
      throw new AdminError("Give the event a title first, so the picture can match it.");
    }

    const [{ made }] = await db
      .select({ made: count() })
      .from(flyerArtDrafts)
      .where(gte(flyerArtDrafts.createdAt, new Date(Date.now() - DAY_MS)));
    if (made + FLYER_ART_CHOICES > FLYER_ART_DAILY_LIMIT) {
      throw new AdminError(
        "The flyer maker has drawn all the pictures it can for today. Please try again tomorrow."
      );
    }

    // Rows are claimed before the model runs, so every picture is counted
    // against the limit even if it, or the request, fails halfway.
    const reserved = Array.from(
      { length: FLYER_ART_CHOICES },
      () => `${RESERVED_PREFIX}${crypto.randomUUID()}`
    );
    await db
      .insert(flyerArtDrafts)
      .values(reserved.map((url) => ({ url, createdById: user.id })));

    await sweepUnkeptFlyerArt();

    const prompts = flyerArtPrompts({
      title,
      description: input.description,
      date: toWallClock(input.date, ""),
      idea: input.idea,
      themeId: input.themeId,
    });
    const results = await Promise.allSettled(
      prompts.map(async (prompt, i) => {
        const { image } = await generateImage({
          model: FLYER_ART_MODEL,
          prompt,
          aspectRatio: "4:5",
        });
        const extension = image.mediaType.split("/")[1] ?? "png";
        const blob = await put(`flyer-art/art.${extension}`, Buffer.from(image.uint8Array), {
          access: "public",
          addRandomSuffix: true,
          contentType: image.mediaType,
        });
        await db
          .update(flyerArtDrafts)
          .set({ url: blob.url })
          .where(eq(flyerArtDrafts.url, reserved[i]));
        return blob.url;
      })
    );

    const urls = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Flyer art generation failed:", result.reason);
      }
    }
    if (!urls.length) {
      throw new AdminError(
        "Couldn’t make a flyer right now. Please try again in a minute."
      );
    }
    return urls;
  });
}

// A week, not the limit's day: a form left open overnight still needs its
// unsaved pictures.
async function sweepUnkeptFlyerArt() {
  try {
    const stale = await db
      .select({ url: flyerArtDrafts.url })
      .from(flyerArtDrafts)
      .where(lt(flyerArtDrafts.createdAt, new Date(Date.now() - UNKEPT_ART_LIFETIME_MS)));
    if (!stale.length) return;
    const staleUrls = stale.map((draft) => draft.url);
    const kept = await db
      .select({ url: events.flyerArtUrl })
      .from(events)
      .where(inArray(events.flyerArtUrl, staleUrls));
    const keptUrls = new Set(kept.map((event) => event.url));
    const unkept = staleUrls.filter(
      (url) => !keptUrls.has(url) && !url.startsWith(RESERVED_PREFIX)
    );
    if (unkept.length) await del(unkept);
    await db.delete(flyerArtDrafts).where(inArray(flyerArtDrafts.url, staleUrls));
  } catch (error) {
    console.error("Failed to sweep unkept flyer art:", error);
  }
}
