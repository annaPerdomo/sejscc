import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/lib/i18n";
import { applySiteText, getSiteTextOverrides } from "@/lib/site-text";

const dictionaries = {
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
  ja: () => import("@/dictionaries/ja.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

// `lang` is undefined under the admin root layout, which has no locale segment.
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!locale || !hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary() {
  return getDictionaryFor(await getLocale());
}

export async function getDictionaryFor(locale: Locale) {
  const dict = await getBaseDictionaryFor(locale);
  return applySiteText(dict, locale, await getSiteTextOverrides());
}

export function getBaseDictionaryFor(locale: Locale) {
  return dictionaries[locale]();
}
