import type { Locale } from "@/lib/i18n";

// Event times are stored as LA wall-clock behind a fake UTC marker (4:00 PM in
// Norwalk is stored as 16:00Z), so every formatter must read them back in UTC.

const INTL_LOCALES: Record<Locale, string> = {
  en: "en-US",
  ja: "ja-JP",
};

export function formatEventDate(date: Date | null, locale: Locale = "en") {
  if (!date) return null;
  return date.toLocaleDateString(INTL_LOCALES[locale], {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatEventTime(
  start: Date | null,
  end: Date | null,
  locale: Locale = "en"
) {
  if (!start) return null;
  const fmt = (d: Date) =>
    d.toLocaleTimeString(INTL_LOCALES[locale], {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
