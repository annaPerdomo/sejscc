"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteText } from "@/db/schema";
import { requireUser, revalidateSite } from "@/lib/admin";
import type { Locale } from "@/lib/i18n";
import { siteTextField } from "@/lib/site-text-fields";
import { tooLongMessage } from "@/lib/volunteer-fields";

const NOT_REGISTERED_MESSAGE = "That sentence can't be changed here.";

function checkedLang(lang: string): Locale {
  if (lang !== "en" && lang !== "ja") throw new Error("That language isn't supported.");
  return lang;
}

async function setSiteTextColumn(path: string, lang: Locale, value: string | null): Promise<void> {
  const [existing] = await db.select().from(siteText).where(eq(siteText.path, path));

  const next = {
    en: lang === "en" ? value : existing?.en ?? null,
    ja: lang === "ja" ? value : existing?.ja ?? null,
  };

  if (next.en === null && next.ja === null) {
    if (existing) await db.delete(siteText).where(eq(siteText.path, path));
    return;
  }

  await db
    .insert(siteText)
    .values({ path, ...next })
    .onConflictDoUpdate({ target: siteText.path, set: next });
}

export async function updateSiteText(path: string, lang: Locale, value: string): Promise<void> {
  await requireUser();

  const fieldSpec = siteTextField(path);
  if (!fieldSpec) throw new Error(NOT_REGISTERED_MESSAGE);
  const checked = checkedLang(lang);

  const trimmed = value.trim();
  if (trimmed.length > fieldSpec.max) {
    throw new Error(tooLongMessage(fieldSpec.label, fieldSpec.max));
  }

  await setSiteTextColumn(path, checked, trimmed || null);
  revalidateSite();
}

export async function resetSiteText(path: string, lang: Locale): Promise<void> {
  await requireUser();

  if (!siteTextField(path)) throw new Error(NOT_REGISTERED_MESSAGE);
  const checked = checkedLang(lang);

  await setSiteTextColumn(path, checked, null);
  revalidateSite();
}
