"use client";

import { Fragment } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localePath,
  locales,
  stripLocale,
  type Locale,
} from "@/lib/i18n";

const LABELS: Record<Locale, { text: string; typeClass: string }> = {
  en: { text: "EN", typeClass: "font-display text-xs font-bold tracking-[0.08em]" },
  ja: { text: "日本語", typeClass: "font-accent text-xs font-bold" },
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
      className={`flex items-center gap-2 ${className ?? ""}`}
    >
      {locales.map((locale, index) => (
        <Fragment key={locale}>
          {index > 0 && <span aria-hidden="true" className="h-3 w-px bg-sky/45" />}
          <button
            type="button"
            lang={locale}
            onClick={() => switchTo(locale)}
            aria-pressed={locale === current}
            className={`rounded-sm px-2 py-1 leading-5 transition ${LABELS[locale].typeClass} ${
              locale === current ? "text-white" : "text-sky hover:text-white"
            }`}
          >
            {LABELS[locale].text}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
