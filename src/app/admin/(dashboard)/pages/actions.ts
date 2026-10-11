"use server";

import { del, list } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sitePhotos, siteText } from "@/db/schema";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireUser, revalidateSite } from "@/lib/admin";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import { getImageSize } from "@/lib/image-size";
import type { Locale } from "@/lib/i18n";
import { readPath } from "@/lib/object-path";
import { photoSlot, type PhotoSlot } from "@/lib/photo-slots";
import { siteTextField } from "@/lib/site-text-fields";
import { checkedBlobImageUrl } from "@/lib/uploads";
import { asOneParagraph, tooLongMessage } from "@/lib/volunteer-fields";

const NOT_REGISTERED_MESSAGE = "That sentence can't be changed here.";
const NOT_REGISTERED_PHOTO_MESSAGE = "That photo spot doesn't exist.";
const MISSING_ALT_MESSAGE = "Please describe the photo for visitors who can't see it.";
const NO_OVERRIDE_PHOTO_MESSAGE =
  "This photo is back to the original, so there's no description to change.";
const ALT_MAX = 600;
const LIST_PAGE_LIMIT = 500;
const LIBRARY_LIMIT = 60;

function checkedLang(lang: string): Locale {
  if (lang !== "en" && lang !== "ja") throw new AdminError("That language isn't supported.");
  return lang;
}

async function setSiteTextColumn(path: string, lang: Locale, value: string | null): Promise<void> {
  const [existing] = await db.select().from(siteText).where(eq(siteText.path, path));

  const next = {
    en: lang === "en" ? value : existing?.en ?? null,
    ja: lang === "ja" ? value : existing?.ja ?? null,
  };

  if (next.en === null && next.ja === null) {
    if (existing) await db.delete(siteText).where(eq(siteText.path, path));
    return;
  }

  await db
    .insert(siteText)
    .values({ path, ...next })
    .onConflictDoUpdate({ target: siteText.path, set: next });
}

export async function updateSiteText(path: string, lang: Locale, value: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();

    const fieldSpec = siteTextField(path);
    if (!fieldSpec) throw new AdminError(NOT_REGISTERED_MESSAGE);
    const checked = checkedLang(lang);

    const trimmed = asOneParagraph(value).trim();
    if (trimmed.length > fieldSpec.max) {
      throw new AdminError(tooLongMessage(fieldSpec.label, fieldSpec.max));
    }

    await setSiteTextColumn(path, checked, trimmed ? await withOriginalSpacing(path, checked, trimmed) : null);
    revalidateSite();
  });
}

// Some sentences run straight into a link, so the original ends in a space
// that trimming would otherwise glue the link onto.
async function withOriginalSpacing(path: string, lang: Locale, trimmed: string): Promise<string> {
  const original = readPath(await getBaseDictionaryFor(lang), path);
  return typeof original === "string" && /\s$/.test(original) ? `${trimmed} ` : trimmed;
}

export async function resetSiteText(path: string, lang: Locale): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();

    if (!siteTextField(path)) throw new AdminError(NOT_REGISTERED_MESSAGE);
    const checked = checkedLang(lang);

    await setSiteTextColumn(path, checked, null);
    revalidateSite();
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

function checkedAltJa(altJa: string): string | null {
  const trimmed = altJa.trim();
  if (!trimmed) return null;
  if (trimmed.length > ALT_MAX) {
    throw new AdminError(tooLongMessage("Japanese photo description", ALT_MAX));
  }
  return trimmed;
}

// Call only after the row pointing at `url` has already been updated or
// deleted, so a remaining match means a different slot still needs the blob.
async function deleteOrphanedBlob(url: string | null): Promise<void> {
  if (!url) return;
  const [stillUsed] = await db
    .select({ slot: sitePhotos.slot })
    .from(sitePhotos)
    .where(eq(sitePhotos.url, url));
  if (stillUsed) return;
  try {
    await del(url);
  } catch (error) {
    console.error("Failed to delete photo blob:", error);
  }
}

export async function updateSitePhoto(input: {
  slot: string;
  url: string;
  alt: string;
  altJa: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const slot = checkedSlot(input.slot);
    const url = checkedBlobImageUrl(input.url);
    if (!url) throw new AdminError("That photo didn't upload correctly. Please try again.");
    const alt = checkedAlt(input.alt, slot);
    const altJa = checkedAltJa(input.altJa);

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    const size = await getImageSize(url);

    await db
      .insert(sitePhotos)
      .values({
        slot: slot.id,
        url,
        alt,
        altJa,
        width: size?.width ?? null,
        height: size?.height ?? null,
      })
      .onConflictDoUpdate({
        target: sitePhotos.slot,
        set: { url, alt, altJa, width: size?.width ?? null, height: size?.height ?? null },
      });

    if (existing && existing.url !== url) {
      await deleteOrphanedBlob(existing.url);
    }

    revalidateSite();
  });
}

export async function updateSitePhotoDescription(input: {
  slot: string;
  alt: string;
  altJa: string;
}): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    const slot = checkedSlot(input.slot);
    const alt = checkedAlt(input.alt, slot);
    const altJa = checkedAltJa(input.altJa);

    const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
    if (!existing) throw new AdminError(NO_OVERRIDE_PHOTO_MESSAGE);

    await db.update(sitePhotos).set({ alt, altJa }).where(eq(sitePhotos.slot, slot.id));
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
    await deleteOrphanedBlob(existing.url);

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
