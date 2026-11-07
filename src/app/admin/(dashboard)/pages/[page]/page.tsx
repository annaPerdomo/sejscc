import { notFound } from "next/navigation";
import { assertEditablePagesRegistry, editablePage } from "@/lib/editable-pages";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import { readPath } from "@/lib/object-path";
import { getSitePhotos } from "@/lib/site-photos";
import { getSiteSettings } from "@/lib/site-settings";
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

  const [overrides, en, ja, photos, settings] = await Promise.all([
    getSiteTextOverrides(),
    getBaseDictionaryFor("en"),
    getBaseDictionaryFor("ja"),
    getSitePhotos(),
    getSiteSettings(),
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

  const links: Record<string, string | null> = {};
  for (const section of page.sections) {
    for (const link of section.links) {
      links[link.id] = settings?.[link.column] ?? null;
    }
  }

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <h1 className="font-display text-3xl text-ink">{page.label}</h1>
        <p className="mt-1 mb-8 max-w-xl text-lg text-ink-soft">
          Each part of this page is listed below, in the order a visitor sees
          it. Open a part to see its words and photos
          <span className="hidden lg:inline">
            , and the preview on the right jumps to that part of the website
          </span>
          . Tap any sentence or photo to change it. Parts that come from a list, like
          events, have a button that takes you to that list. Each change goes
          live as soon as you press Save, and you can undo the last one.
        </p>
      </div>
      <PageCanvas
        page={page}
        overrides={Object.fromEntries(overrides)}
        links={links}
        en={en}
        ja={ja}
        tiles={tiles}
      />
    </>
  );
}
