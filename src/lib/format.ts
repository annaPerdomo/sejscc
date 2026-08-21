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

const WEBSITE_ERROR =
  "The website doesn’t look like a web address. Try something like example.org.";

// The public site renders this value as a link href, so only real web
// addresses may pass. Prefixing a bare value with https:// is what rejects a
// javascript: URL, but it quietly rescues two others: "mailto:name@site.org"
// survives as embedded credentials, and a bare word like "TBD" as a hostname —
// hence the userinfo and dotted-hostname checks below.
export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(WEBSITE_ERROR);
  }
  if (url.username || url.password || !url.hostname.includes(".")) {
    throw new Error(WEBSITE_ERROR);
  }
  return url.href;
}

export function normalizeContactEmail(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error(
      "The contact email doesn’t look right. It should be something like name@example.org."
    );
  }
  return trimmed;
}

// Resend magic-link sign-in never populates `name`, so both helpers below
// fall back to deriving something presentable from the email address.
export function firstNameFrom(user: {
  name?: string | null;
  email?: string | null;
}): string | null {
  if (user.name?.trim()) return user.name.trim().split(/\s+/)[0];
  const local = user.email?.split("@")[0];
  const first = local?.split(/[._-]+/)[0];
  return first ? first[0].toUpperCase() + first.slice(1) : null;
}

export function initialsFrom(user: {
  name?: string | null;
  email?: string | null;
}): string {
  const name = user.name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return user.email?.slice(0, 2).toUpperCase() ?? "?";
}
