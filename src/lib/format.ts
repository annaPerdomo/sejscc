import type { UserRole } from "@/db/schema";
import type { Locale } from "@/lib/i18n";

// Event times are stored as LA wall-clock behind a fake UTC marker (4:00 PM in
// Norwalk is stored as 16:00Z), so every formatter must read them back in UTC.

const INTL_LOCALES: Record<Locale, string> = {
  en: "en-US",
  ja: "ja-JP",
};

export function wallClockNow(): Date {
  const la = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
  });
  const [date, time] = la.split(", ");
  const [m, d, y] = date.split("/");
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${time}Z`);
}

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

export function formatCalendarDate(date: Date | null, locale: Locale = "en") {
  if (!date) return null;
  return date.toLocaleDateString(INTL_LOCALES[locale], {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatWeekday(date: Date, locale: Locale = "en") {
  return date.toLocaleDateString(INTL_LOCALES[locale], {
    weekday: "long",
    timeZone: "UTC",
  });
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

// The columns are unbounded text and a server action can be called directly,
// so the ceiling is enforced here rather than by the form's maxLength.
const MAX_URL_LENGTH = 2048;

const websiteError = (label: string) =>
  new Error(
    `The ${label} doesn’t look like a web address. Try something like example.org.`
  );

// The public site renders this value as a link href, so only real web
// addresses may pass. Prefixing a bare value with https:// is what rejects a
// javascript: URL, but it quietly rescues two others: "mailto:name@site.org"
// survives as embedded credentials, and a bare word like "TBD" as a hostname —
// hence the userinfo and dotted-hostname checks below.
export function normalizeWebsiteUrl(
  raw: string,
  label = "website"
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_URL_LENGTH) throw websiteError(label);
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw websiteError(label);
  }
  if (url.username || url.password || !url.hostname.includes(".")) {
    throw websiteError(label);
  }
  return url.href;
}

const MAX_EMAIL_LENGTH = 254;

export function normalizeContactEmail(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (
    trimmed.length > MAX_EMAIL_LENGTH ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  ) {
    throw new Error(
      "The contact email doesn’t look right. It should be something like name@example.org."
    );
  }
  return trimmed;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  editor: "Volunteer",
};

// Resend magic-link sign-in never populates `name`, so this falls back to
// deriving initials from the email address until the admin sets one.
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
