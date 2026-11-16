import { framingFromRow, type PhotoFraming } from "@/lib/photo-framing";
import type { SitePhotoRow } from "@/lib/site-photos";

// A photo that belongs to a record keeps how it is framed in a site_photo row
// named after the record, the same name its `data-edit-record` attribute carries.
export function levelPhotoRecord(id: string): string {
  return `level:${id}:photo`;
}

export function yearEventPhotoRecord(key: string): string {
  return `year:${key}:photo`;
}

export function recordPhotoFraming(
  photos: ReadonlyMap<string, SitePhotoRow>,
  record: string
): PhotoFraming | undefined {
  const row = photos.get(record);
  return row && framingFromRow(row);
}
