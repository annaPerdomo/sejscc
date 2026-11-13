"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { VOLUNTEER_SECTION_ID, boardMembers, volunteerSection } from "@/db/schema";
import type { SectionTextField } from "@/components/volunteer-section";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireUser, revalidateSite } from "@/lib/admin";
import { deleteBlobIfUnused } from "@/lib/blob-cleanup";
import { trackChange, trackOrder } from "@/lib/change-log";
import type { Locale } from "@/lib/i18n";
import { followEnglishOrRestore, type FollowedJapanese } from "@/lib/japanese-drafts";
import { checkedBlobImageUrl } from "@/lib/uploads";
import {
  LONG_MAX,
  MEMBER_TEXT_FIELDS,
  SECTION_TEXT_FIELDS,
  asOneParagraph,
  isSectionTextField,
  memberTextPatch,
  normalizeContactLinkUrl,
  requiredMessage,
  sectionTextPatch,
  textFieldValue,
  tooLongMessage,
} from "@/lib/volunteer-fields";

function tooLong(label: string, max: number): never {
  throw new AdminError(tooLongMessage(label, max));
}

function required(label: string): never {
  throw new AdminError(requiredMessage(label));
}

function requiredField(en: string, ja: string, label: string, max: number) {
  const trimmedEn = en.trim();
  const trimmedJa = ja.trim();
  if (!trimmedEn) required(label);
  if (trimmedEn.length > max) tooLong(label, max);
  if (trimmedJa.length > max) tooLong(`Japanese ${label}`, max);
  return { en: trimmedEn, ja: trimmedJa || null };
}

async function savedSection() {
  const [row] = await db
    .select()
    .from(volunteerSection)
    .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID));
  return row;
}

type SectionColumn = SectionTextField | "photoAlt";

const PHOTO_ALT_COLUMNS = { en: "photoAlt", ja: "photoAltJa", max: LONG_MAX } as const;

async function sectionJapanese(
  spec: { en: SectionColumn; ja: `${SectionColumn}Ja`; max: number },
  english: string,
  typedJapanese?: string | null,
  restore?: string | null
) {
  const saved = await savedSection();
  const savedJapanese = saved?.[spec.ja] ?? null;
  return followEnglishOrRestore(
    {
      english,
      japanese: typedJapanese === undefined ? savedJapanese : typedJapanese,
      max: spec.max,
      saved: { english: saved?.[spec.en] ?? null, japanese: savedJapanese },
    },
    restore
  );
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
  if (!isStringArray(ids)) throw new AdminError(STALE_ORDER_MESSAGE);
  const unique = new Set(ids);
  if (
    unique.size !== ids.length ||
    unique.size !== existingIds.length ||
    existingIds.some((id) => !unique.has(id))
  ) {
    throw new AdminError(STALE_ORDER_MESSAGE);
  }
  return ids;
}

export async function updateSectionText(
  field: SectionTextField,
  lang: Locale,
  value: string,
  japanese?: string | null
): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();

    if (!isSectionTextField(field)) {
      throw new AdminError("That field doesn't exist.");
    }
    if (lang !== "en" && lang !== "ja") {
      throw new AdminError("That language isn't supported.");
    }

    const { label, max } = SECTION_TEXT_FIELDS[field];
    const trimmed = asOneParagraph(value).trim();

    if (lang === "en") {
      if (!trimmed) required(label);
      if (trimmed.length > max) tooLong(label, max);
    } else {
      if (trimmed.length > max) tooLong(`Japanese ${label}`, max);
    }

    const followed =
      lang === "en"
        ? await sectionJapanese(SECTION_TEXT_FIELDS[field], trimmed, undefined, japanese)
        : { japanese: trimmed || null, update: null };
    const patch =
      lang === "en"
        ? { ...sectionTextPatch(field, "en", trimmed), ...sectionTextPatch(field, "ja", followed.japanese) }
        : sectionTextPatch(field, "ja", followed.japanese);

    await trackChange(editor, "volunteerSection", VOLUNTEER_SECTION_ID, () =>
      db
        .update(volunteerSection)
        .set(patch as Partial<typeof volunteerSection.$inferInsert>)
        .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID))
    );

    revalidateSite();
    return followed;
  });
}

export async function updateContactLink(
  lang: Locale,
  label: string,
  url: string,
  japanese?: string | null
): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();

    if (lang !== "en" && lang !== "ja") {
      throw new AdminError("That language isn't supported.");
    }

    const spec = SECTION_TEXT_FIELDS.contactLinkLabel;
    const trimmed = asOneParagraph(label).trim();
    validateText(lang, spec.label, spec.max, true, trimmed);
    const contactLinkUrl = normalizeContactLinkUrl(url);
    const followed =
      lang === "en"
        ? await sectionJapanese(spec, trimmed, undefined, japanese)
        : { japanese: trimmed || null, update: null };

    await trackChange(editor, "volunteerSection", VOLUNTEER_SECTION_ID, () =>
      db
        .update(volunteerSection)
        .set(
          lang === "en"
            ? { contactLinkLabel: trimmed, contactLinkLabelJa: followed.japanese, contactLinkUrl }
            : { contactLinkLabelJa: followed.japanese, contactLinkUrl }
        )
        .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID))
    );

    revalidateSite();
    return followed;
  });
}

export async function updateSectionPhoto(input: {
  photoUrl: string | null;
  photoAlt: string;
  photoAltJa: string;
}): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();

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

    const followed = await sectionJapanese(PHOTO_ALT_COLUMNS, photoAlt.en, photoAlt.ja);

    await trackChange(editor, "volunteerSection", VOLUNTEER_SECTION_ID, () =>
      db
        .update(volunteerSection)
        .set({ photoUrl, photoAlt: photoAlt.en, photoAltJa: followed.japanese })
        .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID))
    );

    if (existing?.photoUrl && existing.photoUrl !== photoUrl) {
      await deleteBlobIfUnused(existing.photoUrl);
    }

    revalidateSite();
    return followed;
  });
}


export async function updateMemberFields(
  id: string,
  lang: Locale,
  values: { name: string; role: string },
  roleJapanese?: string | null
): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();

    if (lang !== "en" && lang !== "ja") throw new AdminError("That language isn't supported.");

    const nameSpec = MEMBER_TEXT_FIELDS.name;
    const roleSpec = MEMBER_TEXT_FIELDS.role;
    const trimmedName = values.name.trim();
    const trimmedRole = values.role.trim();
    validateText(lang, nameSpec.label, nameSpec.max, nameSpec.required, trimmedName);
    validateText(lang, roleSpec.label, roleSpec.max, roleSpec.required, trimmedRole);

    const [existing] = await db.select().from(boardMembers).where(eq(boardMembers.id, id));
    if (!existing) throw new AdminError(NOT_FOUND_MESSAGE);

    const role = textFieldValue(roleSpec.required, lang, trimmedRole);
    const namePatch = memberTextPatch("name", lang, textFieldValue(nameSpec.required, lang, trimmedName));
    const followed =
      lang === "en"
        ? await followEnglishOrRestore(
            {
              english: role,
              japanese: existing.roleJa,
              max: roleSpec.max,
              saved: { english: existing.role, japanese: existing.roleJa },
            },
            roleJapanese
          )
        : { japanese: role, update: null };
    const rolePatch =
      lang === "en" ? { role, roleJa: followed.japanese } : memberTextPatch("role", lang, role);

    await trackChange(editor, "boardMember", id, () =>
      db
        .update(boardMembers)
        .set({ ...namePatch, ...rolePatch } as Partial<typeof boardMembers.$inferInsert>)
        .where(eq(boardMembers.id, id))
    );

    revalidateSite();
    return followed;
  });
}

export async function updateMemberPhoto(
  id: string,
  photoUrl: string | null
): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();

    const [existing] = await db
      .select({ photoUrl: boardMembers.photoUrl })
      .from(boardMembers)
      .where(eq(boardMembers.id, id));
    if (!existing) throw new AdminError(NOT_FOUND_MESSAGE);

    const checkedUrl = checkedBlobImageUrl(photoUrl);
    await trackChange(editor, "boardMember", id, () =>
      db.update(boardMembers).set({ photoUrl: checkedUrl }).where(eq(boardMembers.id, id))
    );

    if (existing.photoUrl && existing.photoUrl !== checkedUrl) {
      await deleteBlobIfUnused(existing.photoUrl);
    }

    revalidateSite();
    return { japanese: null, update: null };
  });
}

export async function addBoardMember(name: string): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const editor = await requireUser();

    const trimmed = name.trim();
    const { label, max } = MEMBER_TEXT_FIELDS.name;
    validateText("en", label, max, true, trimmed);

    const sortOrder = await nextSortOrder(boardMembers);
    const id = crypto.randomUUID();
    await trackChange(editor, "boardMember", id, () =>
      db.insert(boardMembers).values({ id, name: trimmed, sortOrder })
    );

    revalidateSite();
    return { id };
  });
}

export async function deleteBoardMember(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const [existing] = await db
      .select()
      .from(boardMembers)
      .where(eq(boardMembers.id, id));
    if (!existing) throw new AdminError(NOT_FOUND_MESSAGE);

    await trackChange(editor, "boardMember", id, () =>
      db.delete(boardMembers).where(eq(boardMembers.id, id))
    );
    await deleteBlobIfUnused(existing.photoUrl);

    revalidateSite();
  });
}

export async function setBoardMemberVisible(
  id: string,
  visible: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const result = await trackChange(editor, "boardMember", id, () =>
      db.update(boardMembers).set({ visible }).where(eq(boardMembers.id, id)).returning({ id: boardMembers.id })
    );
    if (result.length === 0) throw new AdminError(NOT_FOUND_MESSAGE);

    revalidateSite();
  });
}

export async function reorderBoardMembers(orderedIds: string[]): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const existing = await db.select({ id: boardMembers.id }).from(boardMembers);
    const ids = checkedOrder(
      orderedIds,
      existing.map((row) => row.id)
    );

    const [firstUpdate, ...restUpdates] = ids.map((id, index) =>
      db.update(boardMembers).set({ sortOrder: index }).where(eq(boardMembers.id, id))
    );
    if (!firstUpdate) return;
    await trackOrder(editor, "boardMember", () => db.batch([firstUpdate, ...restUpdates]));

    revalidateSite();
  });
}

export async function updateContactLinkLabel(
  lang: Locale,
  label: string,
  japanese?: string | null
): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();
    if (lang !== "en" && lang !== "ja") throw new AdminError("That language isn't supported.");
    const spec = SECTION_TEXT_FIELDS.contactLinkLabel;
    const trimmed = asOneParagraph(label).trim();
    validateText(lang, spec.label, spec.max, true, trimmed);
    const followed =
      lang === "en"
        ? await sectionJapanese(spec, trimmed, undefined, japanese)
        : { japanese: trimmed || null, update: null };
    await trackChange(editor, "volunteerSection", VOLUNTEER_SECTION_ID, () =>
      db
        .update(volunteerSection)
        .set(
          lang === "en"
            ? { contactLinkLabel: trimmed, contactLinkLabelJa: followed.japanese }
            : { contactLinkLabelJa: followed.japanese }
        )
        .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID))
    );
    revalidateSite();
    return followed;
  });
}

export async function updateSectionPhotoDescription(
  photoAlt: string,
  photoAltJa: string
): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();
    const alt = requiredField(photoAlt, photoAltJa, "photo description", LONG_MAX);
    const followed = await sectionJapanese(PHOTO_ALT_COLUMNS, alt.en, alt.ja);
    await trackChange(editor, "volunteerSection", VOLUNTEER_SECTION_ID, () =>
      db
        .update(volunteerSection)
        .set({ photoAlt: alt.en, photoAltJa: followed.japanese })
        .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID))
    );
    revalidateSite();
    return followed;
  });
}
