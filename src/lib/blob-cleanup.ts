import { del } from "@vercel/blob";
import { arrayContains, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  boardMembers,
  events,
  groups,
  schoolLevels,
  schoolYearEvents,
  sitePhotos,
  volunteerSection,
} from "@/db/schema";
import { isUploadedFileUrl } from "@/lib/format";

async function isInUse(url: string): Promise<boolean> {
  const checks = await Promise.all([
    db.select({ id: sitePhotos.slot }).from(sitePhotos).where(eq(sitePhotos.url, url)).limit(1),
    db.select({ id: schoolLevels.id }).from(schoolLevels).where(eq(schoolLevels.photoUrl, url)).limit(1),
    db
      .select({ id: schoolYearEvents.id })
      .from(schoolYearEvents)
      .where(eq(schoolYearEvents.photoUrl, url))
      .limit(1),
    db
      .select({ id: volunteerSection.id })
      .from(volunteerSection)
      .where(eq(volunteerSection.photoUrl, url))
      .limit(1),
    db.select({ id: boardMembers.id }).from(boardMembers).where(eq(boardMembers.photoUrl, url)).limit(1),
    db
      .select({ id: groups.id })
      .from(groups)
      .where(or(eq(groups.imageUrl, url), arrayContains(groups.photoUrls, [url])))
      .limit(1),
    db.select({ id: events.id }).from(events).where(eq(events.flyerUrl, url)).limit(1),
  ]);
  return checks.some((rows) => rows.length > 0);
}

// A library photo can be in use in several spots. Call this after saving the
// row that dropped the URL, or that row still counts as using it.
export async function deleteBlobIfUnused(url: string | null): Promise<void> {
  if (!url || !isUploadedFileUrl(url)) return;
  try {
    if (await isInUse(url)) return;
    await del(url);
  } catch (error) {
    console.error("Failed to delete photo blob:", error);
  }
}
