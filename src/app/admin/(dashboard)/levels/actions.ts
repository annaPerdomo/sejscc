"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolLevels, schoolLevelStatuses, type SchoolLevelStatus } from "@/db/schema";
import { requireUser, revalidateSite } from "@/lib/admin";
import { isUploadedFileUrl } from "@/lib/format";
import { checkedBlobImageUrl } from "@/lib/uploads";

export type LevelInput = {
  name: string;
  nameJa: string;
  kanji: string;
  summary: string;
  summaryJa: string;
  status: SchoolLevelStatus;
  description: string;
  descriptionJa: string;
  points: string;
  pointsJa: string;
  photoAlt: string;
  photoAltJa: string;
};

export type PhotoUrlInput = string | null | "unchanged";

const NAME_MAX = 80;
const KANJI_MAX = 8;
const SUMMARY_MAX = 160;
const DESCRIPTION_MAX = 1200;

const NOT_FOUND_MESSAGE =
  "That class level no longer exists. Please reload the page.";

function trimmedOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function linesOf(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function levelValues(input: LevelInput, requirePhotoAlt: boolean) {
  const name = input.name.trim();
  if (!name) throw new Error("Please enter a name for this class level.");
  if (name.length > NAME_MAX) {
    throw new Error(`The name is too long — please keep it under ${NAME_MAX} characters.`);
  }

  const summary = input.summary.trim();
  if (!summary) throw new Error("Please enter a one-line summary.");
  if (summary.length > SUMMARY_MAX) {
    throw new Error(`The summary is too long — please keep it under ${SUMMARY_MAX} characters.`);
  }

  const description = input.description.trim();
  if (!description) throw new Error("Please enter a description.");
  if (description.length > DESCRIPTION_MAX) {
    throw new Error(
      `The description is too long — please keep it under ${DESCRIPTION_MAX} characters.`
    );
  }

  if (!schoolLevelStatuses.includes(input.status)) {
    throw new Error("Please choose a valid status.");
  }

  const kanji = input.kanji.trim();
  if (kanji.length > KANJI_MAX) {
    throw new Error(`The plaque kanji is too long — please keep it under ${KANJI_MAX} characters.`);
  }

  const photoAlt = input.photoAlt.trim();
  if (requirePhotoAlt && !photoAlt) {
    throw new Error("Please describe the photo for people who can't see it.");
  }

  return {
    name,
    nameJa: trimmedOrNull(input.nameJa),
    kanji: kanji || null,
    summary,
    summaryJa: trimmedOrNull(input.summaryJa),
    status: input.status,
    description,
    descriptionJa: trimmedOrNull(input.descriptionJa),
    points: linesOf(input.points),
    pointsJa: linesOf(input.pointsJa),
    photoAlt,
    photoAltJa: trimmedOrNull(input.photoAltJa),
  };
}

async function nextSortOrder(): Promise<number> {
  const existing = await db.select({ sortOrder: schoolLevels.sortOrder }).from(schoolLevels);
  return existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
}

async function deleteBlobBestEffort(url: string | null) {
  if (!url || !isUploadedFileUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.error("Failed to delete class level photo blob:", error);
  }
}

export async function createSchoolLevel(
  input: LevelInput,
  photoUrl: string | null
): Promise<{ id: string }> {
  await requireUser();
  const checkedPhotoUrl = checkedBlobImageUrl(photoUrl);
  const values = levelValues(input, checkedPhotoUrl !== null);
  const sortOrder = await nextSortOrder();

  const [row] = await db
    .insert(schoolLevels)
    .values({ ...values, photoUrl: checkedPhotoUrl, sortOrder })
    .returning({ id: schoolLevels.id });

  revalidateSite();
  return { id: row.id };
}

export async function updateSchoolLevel(
  id: string,
  input: LevelInput,
  photoUrl: PhotoUrlInput
): Promise<void> {
  await requireUser();
  const [existing] = await db.select().from(schoolLevels).where(eq(schoolLevels.id, id));
  if (!existing) throw new Error(NOT_FOUND_MESSAGE);

  const nextPhotoUrl =
    photoUrl === "unchanged" ? existing.photoUrl : checkedBlobImageUrl(photoUrl);
  const values = levelValues(input, nextPhotoUrl !== null);

  await db
    .update(schoolLevels)
    .set({ ...values, photoUrl: nextPhotoUrl })
    .where(eq(schoolLevels.id, id));

  if (existing.photoUrl && existing.photoUrl !== nextPhotoUrl) {
    await deleteBlobBestEffort(existing.photoUrl);
  }

  revalidateSite();
}

export async function deleteSchoolLevel(id: string): Promise<void> {
  await requireUser();
  const [existing] = await db.select().from(schoolLevels).where(eq(schoolLevels.id, id));
  if (!existing) return;

  await db.delete(schoolLevels).where(eq(schoolLevels.id, id));
  await deleteBlobBestEffort(existing.photoUrl);

  revalidateSite();
}

export async function setSchoolLevelVisible(id: string, visible: boolean): Promise<void> {
  await requireUser();
  const result = await db
    .update(schoolLevels)
    .set({ visible })
    .where(eq(schoolLevels.id, id))
    .returning({ id: schoolLevels.id });
  if (result.length === 0) throw new Error(NOT_FOUND_MESSAGE);

  revalidateSite();
}

export type ReorderResult = { ok: true } | { ok: false; reason: "stale" };

export async function reorderSchoolLevels(orderedIds: string[]): Promise<ReorderResult> {
  await requireUser();
  const existing = await db
    .select({ id: schoolLevels.id, sortOrder: schoolLevels.sortOrder })
    .from(schoolLevels);

  const ids = Array.isArray(orderedIds) ? orderedIds : [];
  const unique = new Set(ids);
  if (
    unique.size !== ids.length ||
    unique.size !== existing.length ||
    existing.some((level) => !unique.has(level.id))
  ) {
    return { ok: false, reason: "stale" };
  }

  const current = new Map(existing.map((level) => [level.id, level.sortOrder]));
  if (ids.every((id, index) => current.get(id) === index)) return { ok: true };

  const [firstUpdate, ...restUpdates] = ids.map((id, index) =>
    db.update(schoolLevels).set({ sortOrder: index }).where(eq(schoolLevels.id, id))
  );
  if (!firstUpdate) return { ok: true };
  await db.batch([firstUpdate, ...restUpdates]);

  revalidateSite();
  return { ok: true };
}
