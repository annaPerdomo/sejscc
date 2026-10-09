import { cache } from "react";
import { db } from "@/db";
import { siteText } from "@/db/schema";
import { failSoft } from "@/lib/fail-soft";
import type { Locale } from "@/lib/i18n";
import { writePath } from "@/lib/object-path";

export type SiteTextOverrides = ReadonlyMap<string, { en: string | null; ja: string | null }>;

export const getSiteTextOverrides = cache(async function getSiteTextOverrides(): Promise<SiteTextOverrides> {
  const rows = await failSoft(db.select().from(siteText), []);
  return new Map(rows.map((row) => [row.path, { en: row.en, ja: row.ja }]));
});

export function applySiteText<T>(dict: T, locale: Locale, overrides: SiteTextOverrides): T {
  if (overrides.size === 0) return dict;
  const next = structuredClone(dict) as Record<string, unknown>;
  for (const [path, value] of overrides) {
    const override = locale === "en" ? value.en : value.ja;
    if (typeof override === "string") writePath(next, path, override);
  }
  return next as T;
}
