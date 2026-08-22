"use server";

import { del } from "@vercel/blob";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { groups, type GroupStatus } from "@/db/schema";
import { requireUser, revalidateSite } from "@/lib/admin";
import {
  normalizeContactEmail,
  normalizeWebsiteUrl,
  slugify,
} from "@/lib/format";

export type GroupInput = {
  name: string;
  description: string;
  imageUrl: string | null;
  websiteUrl: string;
  contactEmail: string;
  meetingSchedule: string;
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

function groupValues(input: GroupInput) {
  const name = trimmed(input.name, 100);
  if (!name) throw new Error("A group name is required.");
  return {
    name,
    description: trimmed(input.description, 500),
    imageUrl: checkedImageUrl(input.imageUrl),
    websiteUrl: normalizeWebsiteUrl(input.websiteUrl),
    contactEmail: normalizeContactEmail(input.contactEmail),
    meetingSchedule: trimmed(input.meetingSchedule, 100),
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

export async function moveGroup(id: string, direction: "up" | "down") {
  await requireUser();
  const ordered = await db
    .select()
    .from(groups)
    .orderBy(asc(groups.sortOrder), asc(groups.name));
  const from = ordered.findIndex((group) => group.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ordered.length) return;
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];

  // Rewriting every position also repairs ties left by rows that predate sort
  // ordering. It has to land as one batch: a half-applied renumbering leaves
  // some rows sequenced and the rest tied at 0, which reshuffles the list.
  const updates = ordered.flatMap((group, index) =>
    group.sortOrder === index
      ? []
      : [
          db
            .update(groups)
            .set({ sortOrder: index })
            .where(eq(groups.id, group.id)),
        ]
  );
  const [firstUpdate, ...restUpdates] = updates;
  if (!firstUpdate) return;
  await db.batch([firstUpdate, ...restUpdates]);

  revalidateSite();
}
