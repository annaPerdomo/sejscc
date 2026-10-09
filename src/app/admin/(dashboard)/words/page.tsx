import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import { getSiteTextOverrides } from "@/lib/site-text";
import { assertSiteTextRegistry } from "@/lib/site-text-fields";
import { WordsCanvas } from "./words-canvas";

export const dynamic = "force-dynamic";

export default async function WordsPage() {
  const [overrides, en, ja] = await Promise.all([
    getSiteTextOverrides(),
    getBaseDictionaryFor("en"),
    getBaseDictionaryFor("ja"),
  ]);

  assertSiteTextRegistry(en);

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Words on the site</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        Click any sentence to change it. Pick English or Japanese at the top.
        Your change goes live as soon as you press Save, and you can put the
        original words back at any time.
      </p>

      <WordsCanvas overrides={Object.fromEntries(overrides)} en={en} ja={ja} />
    </AdminPageWidth>
  );
}
