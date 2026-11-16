"use server";

import { list } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { SITE_SETTINGS_ID, sitePhotos, siteSettings, siteText } from "@/db/schema";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireUser, revalidateSite } from "@/lib/admin";
import { deleteBlobIfUnused } from "@/lib/blob-cleanup";
import { trackChange, type Editor } from "@/lib/change-log";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import { getImageSize } from "@/lib/image-size";
import type { Locale } from "@/lib/i18n";
import {
  draftJapanese,
  japaneseFollowingEnglish,
  type FollowedJapanese,
  type JapaneseUpdate,
} from "@/lib/japanese-drafts";
import { readPath } from "@/lib/object-path";
import { NO_CROP_ROW, cropToRow, isFullCrop, isPossibleCrop, type PhotoCrop } from "@/lib/photo-crop";
import {
  IMPOSSIBLE_FRAMING_MESSAGE,
  ORIGINAL_PHOTO_URL,
  SIZE_MIN,
  framingFromRow,
  framingToRow,
  isDefaultFraming,
  isPossibleFraming,
  type PhotoFraming,
} from "@/lib/photo-framing";
import { PHOTO_SLOTS, photoSlot, type PhotoSlot } from "@/lib/photo-slots";
import { isFramableRecordPhoto, recordPhoto } from "@/lib/record-photo-store";
import { normalizeSiteLinkUrl, siteLink } from "@/lib/site-links";
import { editableSiteTextField, siteTextNeighbours } from "@/lib/site-text-fields";
import { checkedBlobImageUrl } from "@/lib/uploads";
import { asOneParagraph, tooLongMessage } from "@/lib/volunteer-fields";

const NOT_REGISTERED_MESSAGE = "That sentence can't be changed here.";
const NOT_NEIGHBOURS_MESSAGE = "Those two can't trade places. Please reload the page and try again.";
const NOT_REGISTERED_PHOTO_MESSAGE = "That photo spot doesn't exist.";
const NOT_REGISTERED_LINK_MESSAGE = "That link can't be changed here.";
const MISSING_ALT_MESSAGE = "Please describe the photo for visitors who can't see it.";
const NO_OVERRIDE_PHOTO_MESSAGE =
  "This photo is back to the original, so there's nothing here to change.";
const ALT_MAX = 600;
const LIST_PAGE_LIMIT = 500;
const LIBRARY_LIMIT = 60;

function checkedLang(lang: string): Locale {
  if (lang !== "en" && lang !== "ja") throw new AdminError("That language isn't supported.");
  return lang;
}

type SiteTextPair = Record<Locale, string | null>;

export type SavedSiteText = SiteTextPair & { japanese: JapaneseUpdate | null };

async function savedSiteText(path: string): Promise<SiteTextPair> {
  const [existing] = await db.select().from(siteText).where(eq(siteText.path, path));
  return { en: existing?.en ?? null, ja: existing?.ja ?? null };
}

async function setSiteTextColumns(
  editor: Editor,
  path: string,
  values: Partial<SiteTextPair>
): Promise<SiteTextPair> {
  const saved = await savedSiteText(path);
  const next = {
    en: values.en === undefined ? saved.en : values.en,
    ja: values.ja === undefined ? saved.ja : values.ja,
  };

  await trackChange(editor, "siteText", path, async () => {
    await siteTextWrite(path, next);
  });
  return next;
}

function siteTextWrite(path: string, words: SiteTextPair) {
  return words.en === null && words.ja === null
    ? db.delete(siteText).where(eq(siteText.path, path))
    : db
        .insert(siteText)
        .values({ path, ...words })
        .onConflictDoUpdate({ target: siteText.path, set: words });
}

async function checkedSiteTextField(path: string) {
  const fieldSpec = editableSiteTextField(path, await getBaseDictionaryFor("en"));
  if (!fieldSpec) throw new AdminError(NOT_REGISTERED_MESSAGE);
  return fieldSpec;
}

export async function updateSiteText(
  path: string,
  lang: Locale,
  value: string,
  keepJapanese = false
): Promise<ActionResult<SavedSiteText>> {
  return runAction(async () => {
    const editor = await requireUser();

    const fieldSpec = await checkedSiteTextField(path);
    const checked = checkedLang(lang);

    const trimmed = asOneParagraph(value).trim();
    if (trimmed.length > fieldSpec.max) {
      throw new AdminError(tooLongMessage(fieldSpec.label, fieldSpec.max));
    }

    if (checked === "ja") {
      const ja = trimmed ? await withOriginalSpacing(path, "ja", trimmed) : null;
      const next = await setSiteTextColumns(editor, path, { ja });
      revalidateSite();
      return { ...next, japanese: null };
    }

    if (!trimmed && keepJapanese) {
      const next = await setSiteTextColumns(editor, path, { en: null });
      revalidateSite();
      return { ...next, japanese: null };
    }
    if (!trimmed) return putBackOriginalEnglish(editor, path);

    const english = await withOriginalSpacing(path, "en", trimmed);
    const saved = await savedSiteText(path);
    const japaneseWasWritten = saved.ja !== null && saved.ja !== saved.en;
    if (keepJapanese) {
      const showsEnglish = saved.ja !== null && saved.ja === saved.en;
      const next = await setSiteTextColumns(editor, path, { en: english, ja: showsEnglish ? english : undefined });
      revalidateSite();
      return { ...next, japanese: null };
    }
    if (saved.en === english && japaneseWasWritten) return { ...saved, japanese: null };

    const { text, update } = await japaneseForEnglish(path, english, fieldSpec.max);
    const next = await setSiteTextColumns(editor, path, { en: english, ja: text });
    revalidateSite();
    return { ...next, japanese: update };
  });
}

export async function restoreSiteText(path: string, words: SiteTextPair): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();

    const fieldSpec = await checkedSiteTextField(path);
    const checkedWords = (raw: string | null) => {
      const trimmed = raw === null ? "" : asOneParagraph(raw).trim();
      if (trimmed.length > fieldSpec.max) {
        throw new AdminError(tooLongMessage(fieldSpec.label, fieldSpec.max));
      }
      return trimmed || null;
    };
    const en = checkedWords(words.en);
    const ja = checkedWords(words.ja);

    await setSiteTextColumns(editor, path, {
      en: en && (await withOriginalSpacing(path, "en", en)),
      ja: ja && (await withOriginalSpacing(path, "ja", ja)),
    });
    revalidateSite();
  });
}

async function shownSiteText(path: string): Promise<Record<Locale, string>> {
  const saved = await savedSiteText(path);
  return {
    en: saved.en ?? (await originalSiteText(path, "en")),
    ja: saved.ja ?? (await originalSiteText(path, "ja")),
  };
}

async function originalSiteText(path: string, lang: Locale): Promise<string> {
  const original = readPath(await getBaseDictionaryFor(lang), path);
  return typeof original === "string" ? original : "";
}

// Japanese stays written out beside changed English, so a later save doesn't rewrite it.
async function asOverride(path: string, shown: Record<Locale, string>): Promise<SiteTextPair> {
  const en = shown.en === (await originalSiteText(path, "en")) ? null : shown.en;
  const ja = en === null && shown.ja === (await originalSiteText(path, "ja")) ? null : shown.ja;
  return { en, ja };
}

export async function swapSiteText(
  path: string,
  neighbourPath: string
): Promise<ActionResult<Record<string, SiteTextPair>>> {
  return runAction(async () => {
    const editor = await requireUser();

    await checkedSiteTextField(path);
    const { before, after } = siteTextNeighbours(path);
    if (neighbourPath !== before?.path && neighbourPath !== after?.path) {
      throw new AdminError(NOT_NEIGHBOURS_MESSAGE);
    }

    const [shown, neighbourShown] = [await shownSiteText(path), await shownSiteText(neighbourPath)];
    const words = await asOverride(path, neighbourShown);
    const neighbourWords = await asOverride(neighbourPath, shown);
    // One batch, so a failure can't leave the same paragraph in both places.
    await trackChange(editor, "siteText", path, () =>
      trackChange(editor, "siteText", neighbourPath, () =>
        db.batch([siteTextWrite(path, words), siteTextWrite(neighbourPath, neighbourWords)])
      )
    );
    revalidateSite();
    return { [path]: words, [neighbourPath]: neighbourWords };
  });
}

// Some sentences run straight into a link, so the original ends in a space
// that trimming would otherwise glue the link onto.
async function withOriginalSpacing(path: string, lang: Locale, trimmed: string): Promise<string> {
  const original = readPath(await getBaseDictionaryFor(lang), path);
  return typeof original === "string" && /\s$/.test(original) ? `${trimmed} ` : trimmed;
}

// A null override would fall back to the original Japanese, which no longer matches.
async function japaneseForEnglish(
  path: string,
  english: string,
  max: number
): Promise<{ text: string; update: JapaneseUpdate | null }> {
  const draft = await draftJapanese(english.trim(), max);
  return {
    text: draft.japanese ? await withOriginalSpacing(path, "ja", draft.japanese) : english,
    update: draft.update,
  };
}

// Without an English override, a Japanese override is a person's fix to the original wording.
async function putBackOriginalEnglish(editor: Editor, path: string): Promise<SavedSiteText> {
  const saved = await savedSiteText(path);
  if (saved.en === null) return { ...saved, japanese: null };
  const next = await setSiteTextColumns(editor, path, { en: null, ja: null });
  revalidateSite();
  return { ...next, japanese: null };
}

export async function resetSiteText(path: string, lang: Locale): Promise<ActionResult<SavedSiteText>> {
  return runAction(async () => {
    const editor = await requireUser();

    const fieldSpec = await checkedSiteTextField(path);
    const checked = checkedLang(lang);

    if (checked === "en") return putBackOriginalEnglish(editor, path);

    const saved = await savedSiteText(path);
    const japanese = saved.en ? await japaneseForEnglish(path, saved.en, fieldSpec.max) : null;
    const next = await setSiteTextColumns(editor, path, { ja: japanese?.text ?? null });
    revalidateSite();
    return { ...next, japanese: japanese?.update ?? null };
  });
}

async function setSiteLink(editor: Editor, id: string, url: string | null): Promise<void> {
  const link = siteLink(id);
  if (!link) throw new AdminError(NOT_REGISTERED_LINK_MESSAGE);
  const set = { [link.column]: url };
  await trackChange(editor, "siteSettings", SITE_SETTINGS_ID, () =>
    db
      .insert(siteSettings)
      .values({ id: SITE_SETTINGS_ID, ...set })
      .onConflictDoUpdate({ target: siteSettings.id, set })
  );
  revalidateSite();
}

export async function updateSiteLink(id: string, url: string): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const normalized = normalizeSiteLinkUrl(url);
    if (!normalized) throw new AdminError("Please paste the form's web address, or press Cancel to keep the current link.");
    await setSiteLink(editor, id, normalized);
  });
}

export async function resetSiteLink(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    await setSiteLink(editor, id, null);
  });
}

function checkedSlot(slot: string): PhotoSlot {
  const found = photoSlot(slot);
  if (!found) throw new AdminError(NOT_REGISTERED_PHOTO_MESSAGE);
  return found;
}

function checkedAlt(alt: string, slot: PhotoSlot): string {
  const trimmed = alt.trim();
  if (!trimmed) {
    if (slot.defaultAltPath === null) return "";
    throw new AdminError(MISSING_ALT_MESSAGE);
  }
  if (trimmed.length > ALT_MAX) throw new AdminError(tooLongMessage("photo description", ALT_MAX));
  return trimmed;
}

function checkedFraming(framing: PhotoFraming): PhotoFraming {
  if (!isPossibleFraming(framing)) throw new AdminError(IMPOSSIBLE_FRAMING_MESSAGE);
  const { x, y, zoom, fit, size, wash } = framing;
  return { x, y, zoom, fit, size, wash };
}

function checkedAltJa(altJa: string): string | null {
  const trimmed = altJa.trim();
  if (!trimmed) return null;
  if (trimmed.length > ALT_MAX) {
    throw new AdminError(tooLongMessage("Japanese photo description", ALT_MAX));
  }
  return trimmed;
}

async function altJaFollowingEnglish(
  alt: string,
  typedAltJa: string,
  existing: { alt: string; altJa: string | null } | undefined
): Promise<FollowedJapanese> {
  return japaneseFollowingEnglish({
    english: alt || null,
    japanese: checkedAltJa(typedAltJa),
    max: ALT_MAX,
    saved: { english: existing?.alt || null, japanese: existing?.altJa ?? null },
  });
}

// Call only after the row pointing at `url` has already been updated or
// deleted, so a remaining match means a different slot still needs the blob.
export async function updateSitePhoto(input: {
  slot: string;
  url: string;
  alt: string;
  altJa: string;
  framing: PhotoFraming;
}): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();
    const slot = checkedSlot(input.slot);
    const url = checkedBlobImageUrl(input.url);
    if (!url) throw new AdminError("That photo didn't upload correctly. Please try again.");
    const alt = checkedAlt(input.alt, slot);
    const framing = framingToRow(checkedFraming(input.framing));

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    const followed = await altJaFollowingEnglish(alt, input.altJa, existing);
    const altJa = followed.japanese;
    const size = await getImageSize(url);
    const set = {
      url,
      alt,
      altJa,
      width: size?.width ?? null,
      height: size?.height ?? null,
      ...(existing?.url === url ? {} : NO_CROP_ROW),
      ...framing,
    };

    await trackChange(editor, "sitePhoto", slot.id, () =>
      db
        .insert(sitePhotos)
        .values({ slot: slot.id, ...set })
        .onConflictDoUpdate({ target: sitePhotos.slot, set })
    );

    if (existing && existing.url !== url) {
      await deleteBlobIfUnused(existing.url);
    }
    if (existing?.cropSource && existing.url !== url) await deleteBlobIfUnused(existing.cropSource);

    revalidateSite();
    return followed;
  });
}

export async function updateSitePhotoDetails(input: {
  slot: string;
  alt: string;
  altJa: string;
  framing: PhotoFraming;
}): Promise<ActionResult<FollowedJapanese>> {
  return runAction(async () => {
    const editor = await requireUser();
    const slot = checkedSlot(input.slot);
    const alt = checkedAlt(input.alt, slot);
    const framing = framingToRow(checkedFraming(input.framing));

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    if (!existing) throw new AdminError(NO_OVERRIDE_PHOTO_MESSAGE);
    const followed = await altJaFollowingEnglish(alt, input.altJa, existing);
    const altJa = followed.japanese;

    await trackChange(editor, "sitePhoto", slot.id, () =>
      db.update(sitePhotos).set({ alt, altJa, ...framing }).where(eq(sitePhotos.slot, slot.id))
    );
    revalidateSite();
    return followed;
  });
}

export async function updateOriginalPhotoFraming(input: {
  slot: string;
  framing: PhotoFraming;
}): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const slot = checkedSlot(input.slot);
    if (slot.framable === false) throw new AdminError("This photo always shows in full.");
    const framing = framingToRow(checkedFraming(input.framing));

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    if (existing && existing.url !== ORIGINAL_PHOTO_URL) {
      throw new AdminError(REPLACED_MEANWHILE_MESSAGE);
    }

    const set = { url: ORIGINAL_PHOTO_URL, alt: "", altJa: null, width: null, height: null, ...framing };
    await trackChange(editor, "sitePhoto", slot.id, () =>
      db
        .insert(sitePhotos)
        .values({ slot: slot.id, ...set })
        .onConflictDoUpdate({ target: sitePhotos.slot, set })
    );
    revalidateSite();
  });
}

export async function updateRecordPhotoFraming(input: {
  record: string;
  framing: PhotoFraming;
}): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const record = String(input.record);
    if (!(await isFramableRecordPhoto(record))) throw new AdminError(NOT_REGISTERED_PHOTO_MESSAGE);
    const framing = checkedFraming(input.framing);
    if (framing.size !== SIZE_MIN) throw new AdminError(IMPOSSIBLE_FRAMING_MESSAGE);

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, record));
    const set = { url: ORIGINAL_PHOTO_URL, alt: "", altJa: null, width: null, height: null, ...framingToRow(framing) };
    await trackChange(editor, "sitePhoto", record, async () => {
      if (isDefaultFraming(framing)) {
        if (!existing) return;
        if (existing.cropSource === null) {
          await db.delete(sitePhotos).where(eq(sitePhotos.slot, record));
        } else {
          await db.update(sitePhotos).set(framingToRow(framing)).where(eq(sitePhotos.slot, record));
        }
        return;
      }
      await db
        .insert(sitePhotos)
        .values({ slot: record, ...set })
        .onConflictDoUpdate({ target: sitePhotos.slot, set });
    });
    revalidateSite();
  });
}

async function writeSlotFraming(editor: Editor, slot: PhotoSlot, framing: PhotoFraming): Promise<void> {
  const columns = framingToRow(framing);
  const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));

  if (existing && existing.url !== ORIGINAL_PHOTO_URL) {
    await trackChange(editor, "sitePhoto", slot.id, () =>
      db.update(sitePhotos).set(columns).where(eq(sitePhotos.slot, slot.id))
    );
    return;
  }
  if (isDefaultFraming(framing)) {
    if (!existing) return;
    await trackChange(editor, "sitePhoto", slot.id, () =>
      db.delete(sitePhotos).where(eq(sitePhotos.slot, slot.id))
    );
    return;
  }
  const set = { url: ORIGINAL_PHOTO_URL, alt: "", altJa: null, width: null, height: null, ...columns };
  await trackChange(editor, "sitePhoto", slot.id, () =>
    db
      .insert(sitePhotos)
      .values({ slot: slot.id, ...set })
      .onConflictDoUpdate({ target: sitePhotos.slot, set })
  );
}

export async function updatePhotoFramings(
  input: { slot: string; framing: PhotoFraming }[]
): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    if (!Array.isArray(input) || input.length === 0 || input.length > PHOTO_SLOTS.length) {
      throw new AdminError(NOT_REGISTERED_PHOTO_MESSAGE);
    }
    const entries = input.map((entry) => {
      const slot = checkedSlot(entry.slot);
      if (slot.framable === false) throw new AdminError("This photo always shows in full.");
      return { slot, framing: checkedFraming(entry.framing) };
    });

    try {
      for (const { slot, framing } of entries) await writeSlotFraming(editor, slot, framing);
    } finally {
      revalidateSite();
    }
  });
}

export async function resetSitePhoto(slotId: string): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const slot = checkedSlot(slotId);

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    if (!existing) return;

    await trackChange(editor, "sitePhoto", slot.id, () =>
      db.delete(sitePhotos).where(eq(sitePhotos.slot, slot.id))
    );
    await deleteBlobIfUnused(existing.url);
    if (existing.cropSource) await deleteBlobIfUnused(existing.cropSource);

    revalidateSite();
  });
}

const REPLACED_MEANWHILE_MESSAGE = "This photo was replaced in the meantime. Please close this and try again.";
const IMPOSSIBLE_CROP_MESSAGE = "That crop isn't possible. Please drag the corners again.";

type CropTarget =
  | { kind: "slot"; slot: PhotoSlot }
  | { kind: "record"; record: string; photoUrl: string; photo: NonNullable<Awaited<ReturnType<typeof recordPhoto>>> };

async function checkedCropTarget(target: string): Promise<CropTarget> {
  const name = String(target);
  const slot = photoSlot(name);
  if (slot) {
    if (slot.framable === false) throw new AdminError(NOT_REGISTERED_PHOTO_MESSAGE);
    return { kind: "slot", slot };
  }
  const photo = await recordPhoto(name);
  if (!photo?.photoUrl) throw new AdminError(NOT_REGISTERED_PHOTO_MESSAGE);
  return { kind: "record", record: name, photoUrl: photo.photoUrl, photo };
}

function framingKeptAfterCrop(row: Parameters<typeof framingFromRow>[0] | undefined) {
  const framing = row && framingFromRow(row);
  return framingToRow(framing?.fit === "whole" ? framing : undefined);
}

function isDefaultFramingRow(row: ReturnType<typeof framingToRow>): boolean {
  return Object.values(row).every((value) => value === null);
}

export async function cropPhoto(input: {
  target: string;
  url: string;
  source: string;
  crop: PhotoCrop;
  alt: string;
  altJa: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const cropTarget = await checkedCropTarget(input.target);
    const url = checkedBlobImageUrl(input.url);
    if (!url) throw new AdminError("That photo didn't upload correctly. Please try again.");
    try {
      const { left, top, width, height } = input.crop;
      const crop = { left, top, width, height };
      if (!isPossibleCrop(crop) || isFullCrop(crop)) throw new AdminError(IMPOSSIBLE_CROP_MESSAGE);

      if (cropTarget.kind === "slot") {
        const { slot } = cropTarget;
        const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
        const source =
          existing?.cropSource ?? (existing && existing.url !== ORIGINAL_PHOTO_URL ? existing.url : ORIGINAL_PHOTO_URL);
        if (input.source !== (source === ORIGINAL_PHOTO_URL ? slot.defaultSrc : source)) {
          throw new AdminError(REPLACED_MEANWHILE_MESSAGE);
        }
        const previousCropped = existing && existing.cropSource !== null ? existing.url : null;
        const keepsReplacedAlt = existing !== undefined && existing.url !== ORIGINAL_PHOTO_URL;
        const alt = keepsReplacedAlt ? existing.alt : checkedAlt(input.alt, slot);
        const altJa = keepsReplacedAlt ? existing.altJa : checkedAltJa(input.altJa);
        const size = await getImageSize(url);
        const set = {
          url,
          alt,
          altJa,
          width: size?.width ?? null,
          height: size?.height ?? null,
          ...cropToRow(source, crop),
          ...framingKeptAfterCrop(existing),
        };
        await trackChange(editor, "sitePhoto", slot.id, () =>
          db
            .insert(sitePhotos)
            .values({ slot: slot.id, ...set })
            .onConflictDoUpdate({ target: sitePhotos.slot, set })
        );
        await deleteBlobIfUnused(previousCropped);
      } else {
        const { record, photo, photoUrl } = cropTarget;
        const [row] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, record));
        const source = row?.cropSource ?? photoUrl;
        if (input.source !== source) throw new AdminError(REPLACED_MEANWHILE_MESSAGE);
        const previousCropped = row && row.cropSource !== null ? photoUrl : null;
        const set = {
          url: ORIGINAL_PHOTO_URL,
          alt: "",
          altJa: null,
          width: null,
          height: null,
          ...cropToRow(source, crop),
          ...framingKeptAfterCrop(row),
        };
        await trackChange(editor, "sitePhoto", record, () =>
          db
            .insert(sitePhotos)
            .values({ slot: record, ...set })
            .onConflictDoUpdate({ target: sitePhotos.slot, set })
        );
        await trackChange(editor, photo.change, photo.rowId, () => photo.write(url));
        await deleteBlobIfUnused(previousCropped);
      }

    } catch (e) {
      await deleteBlobIfUnused(url);
      throw e;
    }

    revalidateSite();
  });
}

export async function removePhotoCrop(target: string): Promise<ActionResult> {
  return runAction(async () => {
    const editor = await requireUser();
    const cropTarget = await checkedCropTarget(target);
    const name = cropTarget.kind === "slot" ? cropTarget.slot.id : cropTarget.record;
    const [row] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, name));
    if (!row || row.cropSource === null) throw new AdminError("This photo isn't cropped.");
    const cropSource = row.cropSource;
    const framing = framingKeptAfterCrop(row);

    if (cropTarget.kind === "slot") {
      const croppedCopy = row.url;
      if (cropSource === ORIGINAL_PHOTO_URL) {
        await trackChange(editor, "sitePhoto", name, async () => {
          if (isDefaultFramingRow(framing)) {
            await db.delete(sitePhotos).where(eq(sitePhotos.slot, name));
            return;
          }
          const set = {
            url: ORIGINAL_PHOTO_URL,
            alt: "",
            altJa: null,
            width: null,
            height: null,
            ...NO_CROP_ROW,
            ...framing,
          };
          await db.update(sitePhotos).set(set).where(eq(sitePhotos.slot, name));
        });
      } else {
        const size = await getImageSize(cropSource);
        const set = {
          url: cropSource,
          width: size?.width ?? null,
          height: size?.height ?? null,
          ...NO_CROP_ROW,
          ...framing,
        };
        await trackChange(editor, "sitePhoto", name, () =>
          db.update(sitePhotos).set(set).where(eq(sitePhotos.slot, name))
        );
      }
      await deleteBlobIfUnused(croppedCopy);
    } else {
      const { photo, photoUrl: croppedCopy } = cropTarget;
      await trackChange(editor, photo.change, photo.rowId, () => photo.write(cropSource));
      await trackChange(editor, "sitePhoto", name, async () => {
        if (isDefaultFramingRow(framing)) {
          await db.delete(sitePhotos).where(eq(sitePhotos.slot, name));
          return;
        }
        await db
          .update(sitePhotos)
          .set({ ...NO_CROP_ROW, ...framing })
          .where(eq(sitePhotos.slot, name));
      });
      await deleteBlobIfUnused(croppedCopy);
    }

    revalidateSite();
  });
}

export async function listUploadedPhotos(): Promise<ActionResult<{ url: string; uploadedAt: string }[]>> {
  return runAction(async () => {
    await requireUser();

    const blobs: { url: string; uploadedAt: Date }[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: "site/", cursor });
      blobs.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && blobs.length < LIST_PAGE_LIMIT);

    return blobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, LIBRARY_LIMIT)
      .map((blob) => ({ url: blob.url, uploadedAt: blob.uploadedAt.toISOString() }));
  });
}
