"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { VOLUNTEER_SECTION_ID, boardMembers, volunteerSection } from "@/db/schema";
import type { SectionTextField } from "@/components/volunteer-section";
import { requireUser, revalidateSite } from "@/lib/admin";
import { isUploadedFileUrl } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { checkedBlobImageUrl } from "@/lib/uploads";
import {
  LONG_MAX,
  MEMBER_TEXT_FIELDS,
  SECTION_TEXT_FIELDS,
  isSectionTextField,
  memberTextPatch,
  requiredMessage,
  sectionTextPatch,
  textFieldValue,
  tooLongMessage,
} from "@/lib/volunteer-fields";

function tooLong(label: string, max: number): never {
  throw new Error(tooLongMessage(label, max));
}

function required(label: string): never {
  throw new Error(requiredMessage(label));
}

function requiredField(en: string, ja: string, label: string, max: number) {
  const trimmedEn = en.trim();
  const trimmedJa = ja.trim();
  if (!trimmedEn) required(label);
  if (trimmedEn.length > max) tooLong(label, max);
  if (trimmedJa.length > max) tooLong(`Japanese ${label}`, max);
  return { en: trimmedEn, ja: trimmedJa || null };
}

function validateText(
  lang: Locale,
  label: string,
  max: number,
  isRequiredField: boolean,
  trimmed: string
) {
  if (lang === "en") {
    if (isRequiredField && !trimmed) required(label);
    if (trimmed.length > max) tooLong(label, max);
  } else if (trimmed.length > max) {
    tooLong(`Japanese ${label}`, max);
  }
}

const NOT_FOUND_MESSAGE = "That entry no longer exists. Please reload the page.";
const STALE_ORDER_MESSAGE =
  "The list changed while you were editing. Please reload the page and try again.";

async function nextSortOrder(table: typeof boardMembers): Promise<number> {
  const existing = await db.select({ sortOrder: table.sortOrder }).from(table);
  return existing.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function checkedOrder(ids: unknown, existingIds: string[]): string[] {
  if (!isStringArray(ids)) throw new Error(STALE_ORDER_MESSAGE);
  const unique = new Set(ids);
  if (
    unique.size !== ids.length ||
    unique.size !== existingIds.length ||
    existingIds.some((id) => !unique.has(id))
  ) {
    throw new Error(STALE_ORDER_MESSAGE);
  }
  return ids;
}

export async function updateSectionText(
  field: SectionTextField,
  lang: Locale,
  value: string
): Promise<void> {
  await requireUser();

  if (!isSectionTextField(field)) {
    throw new Error("That field doesn't exist.");
  }
  if (lang !== "en" && lang !== "ja") {
    throw new Error("That language isn't supported.");
  }

  const { label, max } = SECTION_TEXT_FIELDS[field];
  const trimmed = value.trim();

  if (lang === "en") {
    if (!trimmed) required(label);
    if (trimmed.length > max) tooLong(label, max);
  } else {
    if (trimmed.length > max) tooLong(`Japanese ${label}`, max);
  }

  const patch = sectionTextPatch(field, lang, lang === "en" ? trimmed : trimmed || null);

  await db
    .update(volunteerSection)
    .set(patch as Partial<typeof volunteerSection.$inferInsert>)
    .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID));

  revalidateSite();
}

export async function updateSectionPhoto(input: {
  photoUrl: string | null;
  photoAlt: string;
  photoAltJa: string;
}): Promise<void> {
  await requireUser();

  // Required even with no custom photo, since the bundled fallback still
  // needs alt text for visitors who can't see it.
  const photoAlt = requiredField(
    input.photoAlt,
    input.photoAltJa,
    "photo description",
    LONG_MAX
  );
  const photoUrl = checkedBlobImageUrl(input.photoUrl);

  const [existing] = await db
    .select({ photoUrl: volunteerSection.photoUrl })
    .from(volunteerSection)
    .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID));

  await db
    .update(volunteerSection)
    .set({ photoUrl, photoAlt: photoAlt.en, photoAltJa: photoAlt.ja })
    .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID));

  if (
    existing?.photoUrl &&
    existing.photoUrl !== photoUrl &&
    isUploadedFileUrl(existing.photoUrl)
  ) {
    try {
      await del(existing.photoUrl);
    } catch (error) {
      console.error("Failed to delete the previous board photo blob:", error);
    }
  }

  revalidateSite();
}

async function deleteBlobBestEffort(url: string | null, label: string) {
  if (!url || !isUploadedFileUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.error(`Failed to delete the ${label} blob:`, error);
  }
}

export async function updateMemberFields(
  id: string,
  lang: Locale,
  values: { name: string; role: string }
): Promise<void> {
  await requireUser();

  if (lang !== "en" && lang !== "ja") throw new Error("That language isn't supported.");

  const nameSpec = MEMBER_TEXT_FIELDS.name;
  const roleSpec = MEMBER_TEXT_FIELDS.role;
  const trimmedName = values.name.trim();
  const trimmedRole = values.role.trim();
  validateText(lang, nameSpec.label, nameSpec.max, nameSpec.required, trimmedName);
  validateText(lang, roleSpec.label, roleSpec.max, roleSpec.required, trimmedRole);

  const namePatch = memberTextPatch("name", lang, textFieldValue(nameSpec.required, lang, trimmedName));
  const rolePatch = memberTextPatch("role", lang, textFieldValue(roleSpec.required, lang, trimmedRole));

  const result = await db
    .update(boardMembers)
    .set({ ...namePatch, ...rolePatch } as Partial<typeof boardMembers.$inferInsert>)
    .where(eq(boardMembers.id, id))
    .returning({ id: boardMembers.id });
  if (result.length === 0) throw new Error(NOT_FOUND_MESSAGE);

  revalidateSite();
}

export async function updateMemberPhoto(
  id: string,
  photoUrl: string | null
): Promise<void> {
  await requireUser();

  const [existing] = await db
    .select({ photoUrl: boardMembers.photoUrl })
    .from(boardMembers)
    .where(eq(boardMembers.id, id));
  if (!existing) throw new Error(NOT_FOUND_MESSAGE);

  const checkedUrl = checkedBlobImageUrl(photoUrl);
  await db.update(boardMembers).set({ photoUrl: checkedUrl }).where(eq(boardMembers.id, id));

  if (existing.photoUrl && existing.photoUrl !== checkedUrl) {
    await deleteBlobBestEffort(existing.photoUrl, "previous board member photo");
  }

  revalidateSite();
}

export async function addBoardMember(name: string): Promise<{ id: string }> {
  await requireUser();

  const trimmed = name.trim();
  const { label, max } = MEMBER_TEXT_FIELDS.name;
  validateText("en", label, max, true, trimmed);

  const sortOrder = await nextSortOrder(boardMembers);
  const [row] = await db
    .insert(boardMembers)
    .values({ name: trimmed, sortOrder })
    .returning({ id: boardMembers.id });

  revalidateSite();
  return { id: row.id };
}

export async function deleteBoardMember(id: string): Promise<void> {
  await requireUser();
  const [existing] = await db
    .select()
    .from(boardMembers)
    .where(eq(boardMembers.id, id));
  if (!existing) throw new Error(NOT_FOUND_MESSAGE);

  await db.delete(boardMembers).where(eq(boardMembers.id, id));
  await deleteBlobBestEffort(existing.photoUrl, "board member photo");

  revalidateSite();
}

export async function setBoardMemberVisible(
  id: string,
  visible: boolean
): Promise<void> {
  await requireUser();
  const result = await db
    .update(boardMembers)
    .set({ visible })
    .where(eq(boardMembers.id, id))
    .returning({ id: boardMembers.id });
  if (result.length === 0) throw new Error(NOT_FOUND_MESSAGE);

  revalidateSite();
}

export async function reorderBoardMembers(orderedIds: string[]): Promise<void> {
  await requireUser();
  const existing = await db.select({ id: boardMembers.id }).from(boardMembers);
  const ids = checkedOrder(
    orderedIds,
    existing.map((row) => row.id)
  );

  const [firstUpdate, ...restUpdates] = ids.map((id, index) =>
    db.update(boardMembers).set({ sortOrder: index }).where(eq(boardMembers.id, id))
  );
  if (!firstUpdate) return;
  await db.batch([firstUpdate, ...restUpdates]);

  revalidateSite();
}
