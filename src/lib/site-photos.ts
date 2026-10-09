import { cache } from "react";
import { db } from "@/db";
import { sitePhotos } from "@/db/schema";
import { failSoft } from "@/lib/fail-soft";
import type { Locale } from "@/lib/i18n";
import { photoSlot } from "@/lib/photo-slots";
import type { SitePhotoSource } from "@/components/site-photo";

export type SitePhotoRow = typeof sitePhotos.$inferSelect;

export const getSitePhotos = cache(
  async (): Promise<ReadonlyMap<string, SitePhotoRow>> => {
    const rows = await failSoft(db.select().from(sitePhotos), []);
    return new Map(rows.map((row) => [row.slot, row]));
  }
);

export function slotPhoto(
  map: ReadonlyMap<string, SitePhotoRow>,
  id: string,
  defaultAlt: string,
  locale: Locale
): SitePhotoSource & { width?: number; height?: number } {
  const slot = photoSlot(id);
  if (!slot && process.env.NODE_ENV === "development") {
    throw new Error(`Unregistered photo slot: ${id}`);
  }

  const row = map.get(id);
  if (!row) {
    return { src: slot?.defaultSrc ?? "", alt: defaultAlt };
  }

  return {
    src: row.url,
    alt: locale === "ja" ? row.altJa ?? row.alt : row.alt,
    ...(row.width ? { width: row.width } : {}),
    ...(row.height ? { height: row.height } : {}),
  };
}
