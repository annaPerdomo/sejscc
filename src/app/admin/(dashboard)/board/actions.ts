"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  VOLUNTEER_SECTION_ID,
  boardMembers,
  volunteerRoles,
  volunteerSection,
} from "@/db/schema";
import type { SectionTextField } from "@/components/volunteer-section";
import { requireUser, revalidateSite } from "@/lib/admin";
import { isUploadedFileUrl } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { checkedBlobImageUrl } from "@/lib/uploads";
import {
  LONG_MAX,
  SECTION_TEXT_FIELDS,
  isSectionTextField,
  requiredMessage,
  sectionTextPatch,
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

function optionalField(en: string, ja: string, label: string, max: number) {
  const trimmedEn = en.trim();
  const trimmedJa = ja.trim();
  if (trimmedEn.length > max) tooLong(label, max);
  if (trimmedJa.length > max) tooLong(`Japanese ${label}`, max);
  return { en: trimmedEn || null, ja: trimmedJa || null };
}

const NOT_FOUND_MESSAGE = "That entry no longer exists. Please reload the page.";
const STALE_ORDER_MESSAGE =
  "The list changed while you were editing. Please reload the page and try again.";

function checkedSignupUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
  } catch {
    throw new Error(
      "That sign-up link doesn’t look like a web address. It should start with https://"
    );
  }
  return trimmed;
}

async function nextSortOrder(
  table: typeof boardMembers | typeof volunteerRoles
): Promise<number> {
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

export type BoardMemberInput = {
  name: string;
  nameJa: string;
  role: string;
  roleJa: string;
  photoUrl: string | null;
};

function boardMemberValues(input: BoardMemberInput) {
  const name = requiredField(input.name, input.nameJa, "name", 80);
  const role = optionalField(input.role, input.roleJa, "title", 60);
  return {
    name: name.en,
    nameJa: name.ja,
    role: role.en,
    roleJa: role.ja,
    photoUrl: checkedBlobImageUrl(input.photoUrl),
  };
}

async function deleteBlobBestEffort(url: string | null, label: string) {
  if (!url || !isUploadedFileUrl(url)) return;
  try {
    await del(url);
  } catch (error) {
    console.error(`Failed to delete the ${label} blob:`, error);
  }
}

export async function createBoardMember(input: BoardMemberInput): Promise<void> {
  await requireUser();
  const values = boardMemberValues(input);
  const sortOrder = await nextSortOrder(boardMembers);
  await db.insert(boardMembers).values({ ...values, sortOrder });
  revalidateSite();
}

export async function updateBoardMember(
  id: string,
  input: BoardMemberInput
): Promise<void> {
  await requireUser();
  const [existing] = await db
    .select()
    .from(boardMembers)
    .where(eq(boardMembers.id, id));
  if (!existing) throw new Error(NOT_FOUND_MESSAGE);

  const values = boardMemberValues(input);
  await db.update(boardMembers).set(values).where(eq(boardMembers.id, id));

  if (existing.photoUrl && existing.photoUrl !== values.photoUrl) {
    await deleteBlobBestEffort(existing.photoUrl, "previous board member photo");
  }

  revalidateSite();
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

export type VolunteerRoleInput = {
  title: string;
  titleJa: string;
  description: string;
  descriptionJa: string;
  commitment: string;
  commitmentJa: string;
  signupUrl: string;
};

function volunteerRoleValues(input: VolunteerRoleInput) {
  const title = requiredField(input.title, input.titleJa, "title", 80);
  const description = requiredField(
    input.description,
    input.descriptionJa,
    "description",
    400
  );
  const commitment = optionalField(
    input.commitment,
    input.commitmentJa,
    "commitment",
    60
  );
  return {
    title: title.en,
    titleJa: title.ja,
    description: description.en,
    descriptionJa: description.ja,
    commitment: commitment.en,
    commitmentJa: commitment.ja,
    signupUrl: checkedSignupUrl(input.signupUrl),
  };
}

export async function createVolunteerRole(
  input: VolunteerRoleInput
): Promise<void> {
  await requireUser();
  const values = volunteerRoleValues(input);
  const sortOrder = await nextSortOrder(volunteerRoles);
  await db.insert(volunteerRoles).values({ ...values, sortOrder });
  revalidateSite();
}

export async function updateVolunteerRole(
  id: string,
  input: VolunteerRoleInput
): Promise<void> {
  await requireUser();
  const [existing] = await db
    .select()
    .from(volunteerRoles)
    .where(eq(volunteerRoles.id, id));
  if (!existing) throw new Error(NOT_FOUND_MESSAGE);

  const values = volunteerRoleValues(input);
  await db.update(volunteerRoles).set(values).where(eq(volunteerRoles.id, id));

  revalidateSite();
}

export async function deleteVolunteerRole(id: string): Promise<void> {
  await requireUser();
  const result = await db
    .delete(volunteerRoles)
    .where(eq(volunteerRoles.id, id))
    .returning({ id: volunteerRoles.id });
  if (result.length === 0) throw new Error(NOT_FOUND_MESSAGE);

  revalidateSite();
}

export async function setVolunteerRoleVisible(
  id: string,
  visible: boolean
): Promise<void> {
  await requireUser();
  const result = await db
    .update(volunteerRoles)
    .set({ visible })
    .where(eq(volunteerRoles.id, id))
    .returning({ id: volunteerRoles.id });
  if (result.length === 0) throw new Error(NOT_FOUND_MESSAGE);

  revalidateSite();
}

export async function reorderVolunteerRoles(orderedIds: string[]): Promise<void> {
  await requireUser();
  const existing = await db.select({ id: volunteerRoles.id }).from(volunteerRoles);
  const ids = checkedOrder(
    orderedIds,
    existing.map((row) => row.id)
  );

  const [firstUpdate, ...restUpdates] = ids.map((id, index) =>
    db.update(volunteerRoles).set({ sortOrder: index }).where(eq(volunteerRoles.id, id))
  );
  if (!firstUpdate) return;
  await db.batch([firstUpdate, ...restUpdates]);

  revalidateSite();
}
