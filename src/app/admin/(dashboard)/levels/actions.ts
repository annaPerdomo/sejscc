"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolLevels, schoolLevelStatuses, type SchoolLevelStatus } from "@/db/schema";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireUser, revalidateSite } from "@/lib/admin";
import { deleteBlobIfUnused } from "@/lib/blob-cleanup";
import type { Locale } from "@/lib/i18n";
import { checkedBlobImageUrl } from "@/lib/uploads";
import {
  LEVEL_DESCRIPTION_MAX,
  LEVEL_KANJI_MAX,
  LEVEL_NAME_MAX,
  LEVEL_POINT_MAX,
  LEVEL_SUMMARY_MAX,
} from "@/lib/school-level-limits";

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

const ALT_MAX = 600;

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
  if (!name) throw new AdminError("Please enter a name for this class level.");
  if (name.length > LEVEL_NAME_MAX) {
    throw new AdminError(`The name is too long — please keep it under ${LEVEL_NAME_MAX} characters.`);
  }

  const summary = input.summary.trim();
  if (!summary) throw new AdminError("Please enter a one-line summary.");
  if (summary.length > LEVEL_SUMMARY_MAX) {
    throw new AdminError(`The summary is too long — please keep it under ${LEVEL_SUMMARY_MAX} characters.`);
  }

  const description = input.description.trim();
  if (!description) throw new AdminError("Please enter a description.");
  if (description.length > LEVEL_DESCRIPTION_MAX) {
    throw new AdminError(
      `The description is too long — please keep it under ${LEVEL_DESCRIPTION_MAX} characters.`
    );
  }

  if (!schoolLevelStatuses.includes(input.status)) {
    throw new AdminError("Please choose a valid status.");
  }

  const kanji = input.kanji.trim();
  if (kanji.length > LEVEL_KANJI_MAX) {
    throw new AdminError(`The plaque kanji is too long — please keep it under ${LEVEL_KANJI_MAX} characters.`);
  }

  const photoAlt = input.photoAlt.trim();
  if (requirePhotoAlt && !photoAlt) {
    throw new AdminError("Please describe the photo for people who can't see it.");
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


export async function createSchoolLevel(
  input: LevelInput,
  photoUrl: string | null
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
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
  });
}

export async function updateSchoolLevel(
  id: string,
  input: LevelInput,
  photoUrl: PhotoUrlInput
): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const [existing] = await db.select().from(schoolLevels).where(eq(schoolLevels.id, id));
    if (!existing) throw new AdminError(NOT_FOUND_MESSAGE);

    const nextPhotoUrl =
      photoUrl === "unchanged" ? existing.photoUrl : checkedBlobImageUrl(photoUrl);
    const values = levelValues(input, nextPhotoUrl !== null);

    await db
      .update(schoolLevels)
      .set({ ...values, photoUrl: nextPhotoUrl })
      .where(eq(schoolLevels.id, id));

    if (existing.photoUrl && existing.photoUrl !== nextPhotoUrl) {
      await deleteBlobIfUnused(existing.photoUrl);
    }

    revalidateSite();
  });
}

export async function deleteSchoolLevel(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const [existing] = await db.select().from(schoolLevels).where(eq(schoolLevels.id, id));
    if (!existing) return;

    await db.delete(schoolLevels).where(eq(schoolLevels.id, id));
    await deleteBlobIfUnused(existing.photoUrl);

    revalidateSite();
  });
}

export async function setSchoolLevelVisible(
  id: string,
  visible: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const result = await db
      .update(schoolLevels)
      .set({ visible })
      .where(eq(schoolLevels.id, id))
      .returning({ id: schoolLevels.id });
    if (result.length === 0) throw new AdminError(NOT_FOUND_MESSAGE);

    revalidateSite();
  });
}

export type ReorderResult = { ok: true } | { ok: false; reason: "stale" };

export async function reorderSchoolLevels(
  orderedIds: string[]
): Promise<ActionResult<ReorderResult>> {
  return runAction(async () => {
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
  });
}

export type LevelTextField = "name" | "summary" | "description" | "kanji";

const LEVEL_TEXT_FIELDS = {
  name: { noun: "name", max: LEVEL_NAME_MAX, en: "name", ja: "nameJa" },
  summary: { noun: "summary", max: LEVEL_SUMMARY_MAX, en: "summary", ja: "summaryJa" },
  description: { noun: "description", max: LEVEL_DESCRIPTION_MAX, en: "description", ja: "descriptionJa" },
  kanji: { noun: "plaque kanji", max: LEVEL_KANJI_MAX, en: "kanji", ja: "kanji" },
} as const satisfies Record<LevelTextField, { noun: string; max: number; en: string; ja: string }>;

async function existingLevel(id: string) {
  const [existing] = await db.select().from(schoolLevels).where(eq(schoolLevels.id, id));
  if (!existing) throw new AdminError(NOT_FOUND_MESSAGE);
  return existing;
}

function checkedLang(lang: string): Locale {
  if (lang !== "en" && lang !== "ja") throw new AdminError("That language isn't supported.");
  return lang;
}

export async function updateSchoolLevelText(input: {
  id: string;
  field: LevelTextField;
  lang: Locale;
  value: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    if (!Object.hasOwn(LEVEL_TEXT_FIELDS, input.field)) {
      throw new AdminError("That part of the class can't be changed here.");
    }
    const spec = LEVEL_TEXT_FIELDS[input.field];
    const lang = checkedLang(input.lang);
    await existingLevel(input.id);

    const value = input.value.trim();
    if (value.length > spec.max) {
      throw new AdminError(`The ${spec.noun} is too long — please keep it under ${spec.max} characters.`);
    }
    const required = lang === "en" && input.field !== "kanji";
    if (required && !value) throw new AdminError(`Please enter a ${spec.noun} for this class.`);

    const column = lang === "en" ? spec.en : spec.ja;
    await db
      .update(schoolLevels)
      .set({ [column]: value || null })
      .where(eq(schoolLevels.id, input.id));
    revalidateSite();
  });
}

// An empty pointsJa makes /ja show the English points (getSchoolLevels), so it
// is cleared again once no point differs, or later English edits wouldn't reach /ja.
export async function updateSchoolLevelPoint(input: {
  id: string;
  index: number;
  lang: Locale;
  value: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const lang = checkedLang(input.lang);
    const existing = await existingLevel(input.id);
    if (!Number.isInteger(input.index) || input.index < 0 || input.index >= existing.points.length) {
      throw new AdminError("That point no longer exists. Please reload the page.");
    }

    const value = input.value.trim();
    if (!value && lang === "en") {
      throw new AdminError("Please type the point, or press Cancel to keep it as it is.");
    }
    if (value.length > LEVEL_POINT_MAX) {
      throw new AdminError(`The point is too long — please keep it under ${LEVEL_POINT_MAX} characters.`);
    }

    if (lang === "en") {
      const points = existing.points.map((point, i) => (i === input.index ? value : point));
      await db.update(schoolLevels).set({ points }).where(eq(schoolLevels.id, input.id));
    } else {
      const base = existing.pointsJa.length > 0 ? existing.pointsJa : existing.points;
      const translated = base.map((point, i) => (i === input.index ? value || existing.points[i] : point));
      const pointsJa = translated.every((point, i) => point === existing.points[i]) ? [] : translated;
      await db.update(schoolLevels).set({ pointsJa }).where(eq(schoolLevels.id, input.id));
    }
    revalidateSite();
  });
}

export async function updateSchoolLevelPhoto(input: {
  id: string;
  url: string | "unchanged";
  alt: string;
  altJa: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const existing = await existingLevel(input.id);
    const photoUrl = input.url === "unchanged" ? existing.photoUrl : checkedBlobImageUrl(input.url);
    if (!photoUrl) throw new AdminError("That photo didn't upload correctly. Please try again.");

    const photoAlt = input.alt.trim();
    if (!photoAlt) throw new AdminError("Please describe the photo for visitors who can't see it.");
    if (photoAlt.length > ALT_MAX || input.altJa.trim().length > ALT_MAX) {
      throw new AdminError(`The description is too long — please keep it under ${ALT_MAX} characters.`);
    }

    await db
      .update(schoolLevels)
      .set({ photoUrl, photoAlt, photoAltJa: trimmedOrNull(input.altJa) })
      .where(eq(schoolLevels.id, input.id));
    if (existing.photoUrl !== photoUrl) await deleteBlobIfUnused(existing.photoUrl);
    revalidateSite();
  });
}
