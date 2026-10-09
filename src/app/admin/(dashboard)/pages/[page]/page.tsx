import { notFound } from "next/navigation";
import { assertEditablePagesRegistry, editablePage } from "@/lib/editable-pages";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import { readPath } from "@/lib/object-path";
import { getSitePhotos } from "@/lib/site-photos";
import { getSiteTextOverrides } from "@/lib/site-text";
import type { PhotoTile } from "@/components/admin/inline-edit/photo-slot-tile";
import { PageCanvas } from "./page-canvas";

export const dynamic = "force-dynamic";

function defaultAltAt(dict: unknown, path: string | null): string {
  if (!path) return "";
  const value = readPath(dict, path);
  return typeof value === "string" ? value : "";
}

export default async function EditablePagePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageId } = await params;
  const page = editablePage(pageId);
  if (!page) notFound();

  const [overrides, en, ja, photos] = await Promise.all([
    getSiteTextOverrides(),
    getBaseDictionaryFor("en"),
    getBaseDictionaryFor("ja"),
    getSitePhotos(),
  ]);

  assertEditablePagesRegistry(en);

  const tiles: Record<string, PhotoTile> = {};
  for (const section of page.sections) {
    for (const slot of section.photos) {
      const row = photos.get(slot.id);
      const original = {
        src: slot.defaultSrc,
        alt: defaultAltAt(en, slot.defaultAltPath),
        altJa: defaultAltAt(ja, slot.defaultAltPath),
      };
      tiles[slot.id] = {
        slot: slot.id,
        current: row ? { src: row.url, alt: row.alt, altJa: row.altJa ?? "" } : original,
        original,
        isChanged: Boolean(row),
      };
    }
  }

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <h1 className="font-display text-3xl text-ink">{page.label}</h1>
        <p className="mt-1 mb-8 max-w-xl text-stone">
          Below are the words and photos on this page, in the order a visitor
          reads them. Tap a sentence or a photo to change it. The preview on
          the right shows the real page and updates after every save. Each
          change goes live on the website as soon as you press Save, and you
          can undo the last one.
        </p>
      </div>
      <PageCanvas
        page={page}
        overrides={Object.fromEntries(overrides)}
        en={en}
        ja={ja}
        tiles={tiles}
      />
    </>
  );
}
