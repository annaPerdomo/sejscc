"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolYearEvents } from "@/db/schema";
import { requireUser, revalidateSite } from "@/lib/admin";
import { isUploadedFileUrl, slugify } from "@/lib/format";
import { checkedBlobImageUrl } from "@/lib/uploads";

export type SchoolYearEventFormInput = {
  title: string;
  titleJa: string;
  label: string;
  labelJa: string;
  month: number;
  when: string;
  whenJa: string;
  abbr: string;
  abbrJa: string;
  termJa: string;
  gloss: string;
  glossJa: string;
  description: string;
  descriptionJa: string;
  photoAlt: string;
  photoAltJa: string;
  visible: boolean;
};

export type PhotoUrlInput = string | null | "unchanged";

const TITLE_MAX = 80;
const WHEN_MAX = 80;
const LABEL_MAX = 40;
const DESCRIPTION_MAX = 600;
const TERM_JA_MAX = 40;
const GLOSS_MAX = 80;
const ABBR_MAX = 12;

const NOT_FOUND_MESSAGE =
  "That school year event no longer exists. Please reload the page.";

function trimmedOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function eventValues(input: SchoolYearEventFormInput, requirePhotoAlt: boolean) {
  const title = input.title.trim();
  if (!title) throw new Error("Please enter the event's English name.");
  if (title.length > TITLE_MAX) {
    throw new Error(`The event name is too long — please keep it under ${TITLE_MAX} characters.`);
  }

  const month = Math.trunc(input.month);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Please choose a month.");
  }

  const when = input.when.trim();
  if (!when) throw new Error("Please say when this event happens.");
  if (when.length > WHEN_MAX) {
    throw new Error(`"When" is too long — please keep it under ${WHEN_MAX} characters.`);
  }

  const label = input.label.trim();
  if (!label) throw new Error("Please enter a short label.");
  if (label.length > LABEL_MAX) {
    throw new Error(`The short label is too long — please keep it under ${LABEL_MAX} characters.`);
  }

  const description = input.description.trim();
  if (!description) throw new Error("Please enter a description.");
  if (description.length > DESCRIPTION_MAX) {
    throw new Error(
      `The description is too long — please keep it under ${DESCRIPTION_MAX} characters.`
    );
  }

  const termJa = input.termJa.trim();
  if (!termJa) throw new Error("Please enter the Japanese name shown as the accent.");
  if (termJa.length > TERM_JA_MAX) {
    throw new Error(`The Japanese name is too long — please keep it under ${TERM_JA_MAX} characters.`);
  }

  const gloss = input.gloss.trim();
  if (!gloss) throw new Error("Please enter what the event means.");
  if (gloss.length > GLOSS_MAX) {
    throw new Error(`"What it means" is too long — please keep it under ${GLOSS_MAX} characters.`);
  }

  const abbr = input.abbr.trim();
  if (!abbr) throw new Error("Please enter a short month abbreviation.");
  if (abbr.length > ABBR_MAX) {
    throw new Error(`The month abbreviation is too long — please keep it under ${ABBR_MAX} characters.`);
  }

  const photoAlt = input.photoAlt.trim();
  if (requirePhotoAlt && !photoAlt) {
    throw new Error("Please describe the photo for people who can't see it.");
  }

  return {
    title,
    titleJa: trimmedOrNull(input.titleJa),
    label,
    labelJa: trimmedOrNull(input.labelJa),
    month,
    when,
    whenJa: trimmedOrNull(input.whenJa),
    abbr,
    abbrJa: trimmedOrNull(input.abbrJa),
    termJa,
    gloss,
    glossJa: trimmedOrNull(input.glossJa),
    description,
    descriptionJa: trimmedOrNull(input.descriptionJa),
    photoAlt,
    photoAltJa: trimmedOrNull(input.photoAltJa),
    visible: input.visible,
  };
}

async function uniqueKey(title: string): Promise<string> {
  const base = slugify(title) || "event";
  const rows = await db.select({ key: schoolYearEvents.key }).from(schoolYearEvents);
  const taken = new Set(rows.map((row) => row.key));

  if (!taken.has(base)) return base;
  let attempt = 2;
  while (taken.has(`${base}-${attempt}`)) attempt += 1;
  return `${base}-${attempt}`;
}

async function nextSortOrder(): Promise<number> {
  const existing = await db.select({ sortOrder: schoolYearEvents.sortOrder }).from(schoolYearEvents);
  return existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
}

async function deleteBlobBestEffort(url: string | null) {
  if (!url || !isUploadedFileUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.error("Failed to delete school year event photo blob:", error);
  }
}

export async function createSchoolYearEvent(
  input: SchoolYearEventFormInput,
  photoUrl: string | null
): Promise<{ id: string }> {
  await requireUser();
  const checkedPhotoUrl = checkedBlobImageUrl(photoUrl);
  const values = eventValues(input, checkedPhotoUrl !== null);
  const key = await uniqueKey(values.title);
  const sortOrder = await nextSortOrder();

  const [row] = await db
    .insert(schoolYearEvents)
    .values({ ...values, key, photoUrl: checkedPhotoUrl, sortOrder })
    .returning({ id: schoolYearEvents.id });

  revalidateSite();
  return { id: row.id };
}

export async function updateSchoolYearEvent(
  id: string,
  input: SchoolYearEventFormInput,
  photoUrl: PhotoUrlInput
): Promise<void> {
  await requireUser();
  const [existing] = await db.select().from(schoolYearEvents).where(eq(schoolYearEvents.id, id));
  if (!existing) throw new Error(NOT_FOUND_MESSAGE);

  const nextPhotoUrl =
    photoUrl === "unchanged" ? existing.photoUrl : checkedBlobImageUrl(photoUrl);
  const values = eventValues(input, nextPhotoUrl !== null);

  await db
    .update(schoolYearEvents)
    .set({ ...values, photoUrl: nextPhotoUrl })
    .where(eq(schoolYearEvents.id, id));

  if (existing.photoUrl && existing.photoUrl !== nextPhotoUrl) {
    await deleteBlobBestEffort(existing.photoUrl);
  }

  revalidateSite();
}

export async function deleteSchoolYearEvent(id: string): Promise<void> {
  await requireUser();
  const [existing] = await db.select().from(schoolYearEvents).where(eq(schoolYearEvents.id, id));
  if (!existing) return;

  await db.delete(schoolYearEvents).where(eq(schoolYearEvents.id, id));
  await deleteBlobBestEffort(existing.photoUrl);

  revalidateSite();
}

export async function setSchoolYearEventVisible(id: string, visible: boolean): Promise<void> {
  await requireUser();
  const result = await db
    .update(schoolYearEvents)
    .set({ visible })
    .where(eq(schoolYearEvents.id, id))
    .returning({ id: schoolYearEvents.id });
  if (result.length === 0) throw new Error(NOT_FOUND_MESSAGE);

  revalidateSite();
}
