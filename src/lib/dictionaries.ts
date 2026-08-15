import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/lib/i18n";

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
  return dictionaries[await getLocale()]();
}

export function getDictionaryFor(locale: Locale) {
  return dictionaries[locale]();
}
