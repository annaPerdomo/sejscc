"use server";

import { list } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { SITE_SETTINGS_ID, sitePhotos, siteSettings, siteText } from "@/db/schema";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireUser, revalidateSite } from "@/lib/admin";
import { deleteBlobIfUnused } from "@/lib/blob-cleanup";
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
import {
  ORIGINAL_PHOTO_URL,
  ZOOM_MAX,
  ZOOM_MIN,
  framingToRow,
  type PhotoFraming,
} from "@/lib/photo-framing";
import { photoSlot, type PhotoSlot } from "@/lib/photo-slots";
import { normalizeSiteLinkUrl, siteLink } from "@/lib/site-links";
import { editableSiteTextField } from "@/lib/site-text-fields";
import { checkedBlobImageUrl } from "@/lib/uploads";
import { asOneParagraph, tooLongMessage } from "@/lib/volunteer-fields";

const NOT_REGISTERED_MESSAGE = "That sentence can't be changed here.";
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

async function setSiteTextColumns(path: string, values: Partial<SiteTextPair>): Promise<SiteTextPair> {
  const saved = await savedSiteText(path);
  const next = {
    en: values.en === undefined ? saved.en : values.en,
    ja: values.ja === undefined ? saved.ja : values.ja,
  };

  if (next.en === null && next.ja === null) {
    await db.delete(siteText).where(eq(siteText.path, path));
  } else {
    await db
      .insert(siteText)
      .values({ path, ...next })
      .onConflictDoUpdate({ target: siteText.path, set: next });
  }
  return next;
}

async function checkedSiteTextField(path: string) {
  const fieldSpec = editableSiteTextField(path, await getBaseDictionaryFor("en"));
  if (!fieldSpec) throw new AdminError(NOT_REGISTERED_MESSAGE);
  return fieldSpec;
}

export async function updateSiteText(
  path: string,
  lang: Locale,
  value: string
): Promise<ActionResult<SavedSiteText>> {
  return runAction(async () => {
    await requireUser();

    const fieldSpec = await checkedSiteTextField(path);
    const checked = checkedLang(lang);

    const trimmed = asOneParagraph(value).trim();
    if (trimmed.length > fieldSpec.max) {
      throw new AdminError(tooLongMessage(fieldSpec.label, fieldSpec.max));
    }

    if (checked === "ja") {
      const ja = trimmed ? await withOriginalSpacing(path, "ja", trimmed) : null;
      const next = await setSiteTextColumns(path, { ja });
      revalidateSite();
      return { ...next, japanese: null };
    }

    if (!trimmed) return putBackOriginalEnglish(path);

    const english = await withOriginalSpacing(path, "en", trimmed);
    const saved = await savedSiteText(path);
    const japaneseWasWritten = saved.ja !== null && saved.ja !== saved.en;
    if (saved.en === english && japaneseWasWritten) return { ...saved, japanese: null };

    const { text, update } = await japaneseForEnglish(path, english, fieldSpec.max);
    const next = await setSiteTextColumns(path, { en: english, ja: text });
    revalidateSite();
    return { ...next, japanese: update };
  });
}

export async function restoreSiteText(path: string, words: SiteTextPair): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();

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

    await setSiteTextColumns(path, {
      en: en && (await withOriginalSpacing(path, "en", en)),
      ja: ja && (await withOriginalSpacing(path, "ja", ja)),
    });
    revalidateSite();
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
async function putBackOriginalEnglish(path: string): Promise<SavedSiteText> {
  const saved = await savedSiteText(path);
  if (saved.en === null) return { ...saved, japanese: null };
  const next = await setSiteTextColumns(path, { en: null, ja: null });
  revalidateSite();
  return { ...next, japanese: null };
}

export async function resetSiteText(path: string, lang: Locale): Promise<ActionResult<SavedSiteText>> {
  return runAction(async () => {
    await requireUser();

    const fieldSpec = await checkedSiteTextField(path);
    const checked = checkedLang(lang);

    if (checked === "en") return putBackOriginalEnglish(path);

    const saved = await savedSiteText(path);
    const japanese = saved.en ? await japaneseForEnglish(path, saved.en, fieldSpec.max) : null;
    const next = await setSiteTextColumns(path, { ja: japanese?.text ?? null });
    revalidateSite();
    return { ...next, japanese: japanese?.update ?? null };
  });
}

async function setSiteLink(id: string, url: string | null): Promise<void> {
  const link = siteLink(id);
  if (!link) throw new AdminError(NOT_REGISTERED_LINK_MESSAGE);
  const set = { [link.column]: url };
  await db
    .insert(siteSettings)
    .values({ id: SITE_SETTINGS_ID, ...set })
    .onConflictDoUpdate({ target: siteSettings.id, set });
  revalidateSite();
}

export async function updateSiteLink(id: string, url: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const normalized = normalizeSiteLinkUrl(url);
    if (!normalized) throw new AdminError("Please paste the form's web address, or press Cancel to keep the current link.");
    await setSiteLink(id, normalized);
  });
}

export async function resetSiteLink(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    await setSiteLink(id, null);
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

function wholePercent(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function checkedFraming(framing: PhotoFraming): PhotoFraming {
  if (
    !wholePercent(framing.x, 0, 100) ||
    !wholePercent(framing.y, 0, 100) ||
    !wholePercent(framing.zoom, ZOOM_MIN, ZOOM_MAX)
  ) {
    throw new AdminError("That framing isn't possible. Please move or zoom the photo again.");
  }
  return framing;
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
    await requireUser();
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
      ...framing,
    };

    await db
      .insert(sitePhotos)
      .values({ slot: slot.id, ...set })
      .onConflictDoUpdate({ target: sitePhotos.slot, set });

    if (existing && existing.url !== url) {
      await deleteBlobIfUnused(existing.url);
    }

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
    await requireUser();
    const slot = checkedSlot(input.slot);
    const alt = checkedAlt(input.alt, slot);
    const framing = framingToRow(checkedFraming(input.framing));

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    if (!existing) throw new AdminError(NO_OVERRIDE_PHOTO_MESSAGE);
    const followed = await altJaFollowingEnglish(alt, input.altJa, existing);
    const altJa = followed.japanese;

    await db
      .update(sitePhotos)
      .set({ alt, altJa, ...framing })
      .where(eq(sitePhotos.slot, slot.id));
    revalidateSite();
    return followed;
  });
}

export async function updateOriginalPhotoFraming(input: {
  slot: string;
  framing: PhotoFraming;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const slot = checkedSlot(input.slot);
    if (slot.framable === false) throw new AdminError("This photo always shows in full.");
    const framing = framingToRow(checkedFraming(input.framing));

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    if (existing && existing.url !== ORIGINAL_PHOTO_URL) {
      throw new AdminError("This photo was replaced in the meantime. Please close this and try again.");
    }

    const set = { url: ORIGINAL_PHOTO_URL, alt: "", altJa: null, width: null, height: null, ...framing };
    await db
      .insert(sitePhotos)
      .values({ slot: slot.id, ...set })
      .onConflictDoUpdate({ target: sitePhotos.slot, set });
    revalidateSite();
  });
}

export async function resetSitePhoto(slotId: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const slot = checkedSlot(slotId);

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    if (!existing) return;

    await db.delete(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    await deleteBlobIfUnused(existing.url);

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
