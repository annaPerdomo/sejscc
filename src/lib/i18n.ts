// Imported by the proxy — must stay free of server-only imports.

export const locales = ["en", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// The Japanese pages are switched off: add "ja" here to publish them again.
// Their words stay in the database and ja.json meanwhile.
export const publishedLocales: readonly Locale[] = ["en"];
export const japaneseEnabled = publishedLocales.includes("ja");

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isPublishedLocale(value: string): value is Locale {
  return publishedLocales.some((locale) => locale === value);
}

export function localePath(locale: Locale, path: string) {
  if (locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

// Must strip /en too: the proxy rewrites prefix-less URLs to /en internally, so
// client-side pathnames can carry it.
export function stripLocale(path: string) {
  return path.replace(new RegExp(`^/(${locales.join("|")})(?=/|$)`), "") || "/";
}

export function languageAlternates(locale: Locale, path: string) {
  const languages =
    publishedLocales.length > 1
      ? {
          ...Object.fromEntries(publishedLocales.map((each) => [each, localePath(each, path)])),
          "x-default": path,
        }
      : undefined;
  return { canonical: localePath(locale, path), languages };
}
