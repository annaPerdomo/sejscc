// Imported by the proxy — must stay free of server-only imports.

export const locales = ["en", "ja"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
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
