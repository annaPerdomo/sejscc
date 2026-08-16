"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localePath,
  locales,
  stripLocale,
  type Locale,
} from "@/lib/i18n";

const LABELS: Record<Locale, string> = {
  en: "EN",
  ja: "日本語",
};

// The proxy reads this cookie and stops auto-redirecting against the choice.
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function LanguageToggle({
  current,
  label,
  className,
}: {
  current: Locale;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(locale: Locale) {
    if (locale === current) return;
    rememberLocale(locale);
    router.push(localePath(locale, stripLocale(pathname)));
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={`flex items-center rounded-full border border-line bg-white p-0.5 ${className ?? ""}`}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          onClick={() => switchTo(locale)}
          aria-pressed={locale === current}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            locale === current
              ? "bg-ink text-white"
              : "text-stone hover:text-ink"
          }`}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
