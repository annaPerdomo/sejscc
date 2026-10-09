import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import { readPath } from "@/lib/object-path";
import { PHOTO_SLOTS } from "@/lib/photo-slots";
import { getSitePhotos } from "@/lib/site-photos";
import { PhotosCanvas, type PhotoTile } from "./photos-canvas";

export const dynamic = "force-dynamic";

function defaultAltAt(dict: unknown, path: string | null): string {
  if (!path) return "";
  const value = readPath(dict, path);
  return typeof value === "string" ? value : "";
}

export default async function PhotosPage() {
  const [photos, en, ja] = await Promise.all([
    getSitePhotos(),
    getBaseDictionaryFor("en"),
    getBaseDictionaryFor("ja"),
  ]);

  const tiles: PhotoTile[] = PHOTO_SLOTS.map((slot) => {
    const row = photos.get(slot.id);
    const original = {
      src: slot.defaultSrc,
      alt: defaultAltAt(en, slot.defaultAltPath),
      altJa: defaultAltAt(ja, slot.defaultAltPath),
    };
    return {
      slot: slot.id,
      current: row ? { src: row.url, alt: row.alt, altJa: row.altJa ?? "" } : original,
      original,
      isChanged: Boolean(row),
    };
  });

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Photos</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        Every photo on the website, page by page. Change one, or put the
        original back. Each photo needs a short description for visitors who
        can&rsquo;t see it.
      </p>

      <PhotosCanvas tiles={tiles} />
    </AdminPageWidth>
  );
}
