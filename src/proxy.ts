import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  defaultLocale,
  isPublishedLocale,
  locales,
  type Locale,
} from "@/lib/i18n";

function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && isPublishedLocale(cookie)) return cookie;

  const header = request.headers.get("accept-language");
  if (header) {
    // Accept-Language entries arrive in preference order, so q-values are ignorable.
    for (const part of header.split(",")) {
      const tag = part.split(";")[0].trim().toLowerCase();
      const base = tag.split("-")[0];
      if (isPublishedLocale(tag)) return tag;
      if (isPublishedLocale(base)) return base;
    }
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  // /en/events → /events, and the same for a locale that isn't published.
  if (pathLocale && (pathLocale === defaultLocale || !isPublishedLocale(pathLocale))) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(pathLocale.length + 1) || "/";
    const response = NextResponse.redirect(url);
    // Choosing /en must stick, or a Japanese Accept-Language header would bounce
    // the prefix-less follow-up back to /ja. An unpublished locale wasn't a
    // choice of English, so its reader keeps their own for when it returns.
    if (pathLocale === defaultLocale) {
      response.cookies.set(LOCALE_COOKIE, defaultLocale, {
        path: "/",
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: "lax",
      });
    }
    return response;
  }

  if (pathLocale) return;

  const locale = preferredLocale(request);
  if (locale !== defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Segments are anchored so a future /admissions page still gets localized.
  matcher: ["/((?!(?:api|admin|_next)(?:/|$)|.*\\..*).*)"],
};
