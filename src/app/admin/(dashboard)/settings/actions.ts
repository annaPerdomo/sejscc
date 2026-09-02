"use server";

import { db } from "@/db";
import { SITE_SETTINGS_ID, siteSettings } from "@/db/schema";
import { requireAdmin, revalidateSite } from "@/lib/admin";
import { normalizeContactEmail } from "@/lib/format";
import { youtubeVideoId } from "@/lib/video";

export async function updateAccessRequestEmail(raw: string) {
  await requireAdmin();
  const email = normalizeContactEmail(raw);
  await db
    .insert(siteSettings)
    .values({ id: SITE_SETTINGS_ID, accessRequestEmail: email })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { accessRequestEmail: email },
    });
  return email;
}

const MAX_ABOUT_VIDEOS = 6;

export async function updateAboutVideoUrls(raw: string) {
  await requireAdmin();
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > MAX_ABOUT_VIDEOS) {
    throw new Error(`You can list at most ${MAX_ABOUT_VIDEOS} videos.`);
  }

  const urls = lines.map((line) => {
    const videoId = youtubeVideoId(line);
    if (!videoId) {
      throw new Error(
        `"${line}" doesn't look like a YouTube link. Copy the address from the video's page, which looks like https://www.youtube.com/watch?v=abc123.`
      );
    }
    return `https://www.youtube.com/watch?v=${videoId}`;
  });

  await db
    .insert(siteSettings)
    .values({ id: SITE_SETTINGS_ID, aboutVideoUrls: urls })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { aboutVideoUrls: urls },
    });
  revalidateSite();
  return urls;
}
