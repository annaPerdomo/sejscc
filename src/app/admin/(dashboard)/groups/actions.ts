"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groups, weekDays, type GroupStatus, type WeekDay } from "@/db/schema";
import { requireUser, revalidateSite } from "@/lib/admin";
import {
  normalizeContactEmail,
  normalizeWebsiteUrl,
  slugify,
} from "@/lib/format";

export type GroupInput = {
  name: string;
  nameJa: string;
  description: string;
  imageUrl: string | null;
  websiteUrl: string;
  contactEmail: string;
  meetingSchedule: string;
  meetingDays: WeekDay[];
  active: boolean;
  status: GroupStatus;
};

// Uploads go straight to Vercel Blob from the browser, so a URL on any other
// host reached us through a tampered request rather than the upload flow.
function checkedImageUrl(raw: string | null) {
  if (!raw) return null;
  let hostname = "";
  try {
    hostname = new URL(raw).hostname;
  } catch {
    hostname = "";
  }
  if (!hostname.endsWith(".public.blob.vercel-storage.com")) {
    throw new Error("That photo couldn’t be saved. Please upload it again.");
  }
  return raw;
}

// The form caps these too, but the columns are unbounded text and a server
// action can be called directly, so the ceiling has to be enforced here.
function trimmed(value: string, max: number) {
  return value.trim().slice(0, max) || null;
}

// Filter the canonical week, not the payload — inverting this silently loses
// the de-duplication and the ordering.
function checkedMeetingDays(raw: WeekDay[]) {
  if (!Array.isArray(raw)) return [];
  return weekDays.filter((day) => raw.includes(day));
}

function groupValues(input: GroupInput) {
  const name = trimmed(input.name, 100);
  if (!name) throw new Error("A group name is required.");
  return {
    name,
    nameJa: trimmed(input.nameJa, 60),
    description: trimmed(input.description, 500),
    imageUrl: checkedImageUrl(input.imageUrl),
    websiteUrl: normalizeWebsiteUrl(input.websiteUrl),
    contactEmail: normalizeContactEmail(input.contactEmail),
    meetingSchedule: trimmed(input.meetingSchedule, 100),
    meetingDays: checkedMeetingDays(input.meetingDays),
    active: input.active,
    status: input.status,
  };
}

// Best-effort: the row is already written, so a failed cleanup must not
// surface as a save error.
async function deleteImage(url: string) {
  try {
    await del(url);
  } catch (error) {
    console.error("Failed to delete group image blob:", error);
  }
}

export async function createGroup(input: GroupInput) {
  await requireUser();
  const slug = `${slugify(input.name) || "group"}-${crypto
    .randomUUID()
    .slice(0, 6)}`;
  const existing = await db.select({ sortOrder: groups.sortOrder }).from(groups);
  const sortOrder =
    existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
  await db.insert(groups).values({ ...groupValues(input), slug, sortOrder });
  revalidateSite();
}

export async function updateGroup(id: string, input: GroupInput) {
  await requireUser();
  const [existing] = await db.select().from(groups).where(eq(groups.id, id));
  if (!existing) throw new Error("Group not found.");
  const values = groupValues(input);
  await db.update(groups).set(values).where(eq(groups.id, id));

  if (existing.imageUrl && existing.imageUrl !== values.imageUrl) {
    await deleteImage(existing.imageUrl);
  }

  revalidateSite();
}

export async function deleteGroup(id: string) {
  await requireUser();
  const [existing] = await db.select().from(groups).where(eq(groups.id, id));
  if (!existing) return;
  await db.delete(groups).where(eq(groups.id, id));

  if (existing.imageUrl) {
    await deleteImage(existing.imageUrl);
  }

  revalidateSite();
}

export type ReorderResult = { ok: true } | { ok: false; reason: "stale" };

export async function reorderGroups(
  orderedIds: string[]
): Promise<ReorderResult> {
  await requireUser();
  const existing = await db
    .select({ id: groups.id, sortOrder: groups.sortOrder })
    .from(groups);

  // Returned, not thrown: React strips error messages in production. A partial
  // payload would leave the unnamed rows tied at their old positions.
  const ids = Array.isArray(orderedIds) ? orderedIds : [];
  const unique = new Set(ids);
  if (
    unique.size !== ids.length ||
    unique.size !== existing.length ||
    existing.some((group) => !unique.has(group.id))
  ) {
    return { ok: false, reason: "stale" };
  }

  const current = new Map(existing.map((group) => [group.id, group.sortOrder]));
  if (ids.every((id, index) => current.get(id) === index)) return { ok: true };

  // Every row is rewritten, not just the moved ones: skipping the rest lets two
  // concurrent saves interleave into an order neither admin chose. One batch —
  // a partial renumbering leaves the others tied at 0.
  const [firstUpdate, ...restUpdates] = ids.map((id, index) =>
    db.update(groups).set({ sortOrder: index }).where(eq(groups.id, id))
  );
  if (!firstUpdate) return { ok: true };
  await db.batch([firstUpdate, ...restUpdates]);

  revalidateSite();
  return { ok: true };
}
