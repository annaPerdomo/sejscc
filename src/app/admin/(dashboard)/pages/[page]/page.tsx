import { notFound } from "next/navigation";
import { assertEditablePagesRegistry, editablePage } from "@/lib/editable-pages";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import { getSiteTextOverrides } from "@/lib/site-text";
import { PageCanvas } from "./page-canvas";

export const dynamic = "force-dynamic";

export default async function EditablePagePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageId } = await params;
  const page = editablePage(pageId);
  if (!page) notFound();

  const [overrides, en, ja] = await Promise.all([
    getSiteTextOverrides(),
    getBaseDictionaryFor("en"),
    getBaseDictionaryFor("ja"),
  ]);

  assertEditablePagesRegistry(en);

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <h1 className="font-display text-3xl text-ink">{page.label}</h1>
        <p className="mt-1 mb-8 max-w-xl text-stone">
          Below are the words on this page, in the order a visitor reads
          them. Tap a sentence to change it. The preview on the right shows
          the real page and updates after every save. Each change goes live
          on the website as soon as you press Save, and you can undo the
          last one.
        </p>
      </div>
      <PageCanvas page={page} overrides={Object.fromEntries(overrides)} en={en} ja={ja} />
    </>
  );
}
