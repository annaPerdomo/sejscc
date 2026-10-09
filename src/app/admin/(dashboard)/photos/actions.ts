"use server";

import { del, list } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sitePhotos } from "@/db/schema";
import { requireUser, revalidateSite } from "@/lib/admin";
import { getImageSize } from "@/lib/image-size";
import { photoSlot, type PhotoSlot } from "@/lib/photo-slots";
import { checkedBlobImageUrl } from "@/lib/uploads";
import { tooLongMessage } from "@/lib/volunteer-fields";

const NOT_REGISTERED_MESSAGE = "That photo spot doesn't exist.";
const MISSING_ALT_MESSAGE = "Please describe the photo for visitors who can't see it.";
const NO_OVERRIDE_MESSAGE =
  "This photo is back to the original, so there's no description to change.";
const ALT_MAX = 600;
const LIST_PAGE_LIMIT = 500;
const LIBRARY_LIMIT = 60;

function checkedSlot(slot: string): PhotoSlot {
  const found = photoSlot(slot);
  if (!found) throw new Error(NOT_REGISTERED_MESSAGE);
  return found;
}

function checkedAlt(alt: string, slot: PhotoSlot): string {
  const trimmed = alt.trim();
  if (!trimmed) {
    if (slot.defaultAltPath === null) return "";
    throw new Error(MISSING_ALT_MESSAGE);
  }
  if (trimmed.length > ALT_MAX) throw new Error(tooLongMessage("photo description", ALT_MAX));
  return trimmed;
}

function checkedAltJa(altJa: string): string | null {
  const trimmed = altJa.trim();
  if (!trimmed) return null;
  if (trimmed.length > ALT_MAX) {
    throw new Error(tooLongMessage("Japanese photo description", ALT_MAX));
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
}): Promise<void> {
  await requireUser();
  const slot = checkedSlot(input.slot);
  const url = checkedBlobImageUrl(input.url);
  if (!url) throw new Error("That photo didn't upload correctly. Please try again.");
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
}

export async function updateSitePhotoDescription(input: {
  slot: string;
  alt: string;
  altJa: string;
}): Promise<void> {
  await requireUser();
  const slot = checkedSlot(input.slot);
  const alt = checkedAlt(input.alt, slot);
  const altJa = checkedAltJa(input.altJa);

  const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
  if (!existing) throw new Error(NO_OVERRIDE_MESSAGE);

  await db.update(sitePhotos).set({ alt, altJa }).where(eq(sitePhotos.slot, slot.id));
  revalidateSite();
}

export async function resetSitePhoto(slotId: string): Promise<void> {
  await requireUser();
  const slot = checkedSlot(slotId);

  const [existing] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot.id));
  if (!existing) return;

  await db.delete(sitePhotos).where(eq(sitePhotos.slot, slot.id));
  await deleteOrphanedBlob(existing.url);

  revalidateSite();
}

export async function listUploadedPhotos(): Promise<{ url: string; uploadedAt: string }[]> {
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
}
