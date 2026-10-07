import type { Locale } from "@/lib/i18n";

export type CalendarView = "MONTH" | "AGENDA";

export type CalendarSource = {
  key: "facilities" | "comingEvents";
  calendarId: string;
  compactView: CalendarView;
  wideView: CalendarView;
  frameHeight: string;
};

export const TIME_ZONE = "America/Los_Angeles";

// Both are individuals' primary Google calendars, so anything on their own
// calendar shows up here. Org-owned secondary calendars would end that.
export const calendarSources: CalendarSource[] = [
  {
    key: "facilities",
    calendarId: "rtamaki@sejscc.org",
    compactView: "AGENDA",
    wideView: "MONTH",
    frameHeight: "h-112 sm:h-120 md:h-160 lg:h-176",
  },
  {
    key: "comingEvents",
    calendarId: "kimie.matsumoto9@gmail.com",
    compactView: "AGENDA",
    wideView: "AGENDA",
    frameHeight: "h-112 sm:h-120",
  },
];

export function calendarEmbedUrl(
  calendarId: string,
  view: CalendarView,
  locale: Locale,
) {
  const params = new URLSearchParams({
    src: calendarId,
    ctz: TIME_ZONE,
    mode: view,
    hl: locale,
    wkst: "1",
    showTitle: "0",
    showPrint: "0",
    showCalendars: "0",
    showTz: "0",
  });
  return `https://calendar.google.com/calendar/embed?${params}`;
}

export function calendarSubscribeUrl(calendarId: string) {
  const params = new URLSearchParams({ cid: calendarId });
  return `https://calendar.google.com/calendar/u/0/r?${params}`;
}

const HOUR_MS = 60 * 60 * 1000;
const MAX_DETAILS_LENGTH = 1000;

// Times are stored as LA wall clock behind a fake UTC marker, so the "Z" is
// dropped: Google reads a floating time plus `ctz` as local.
function calendarStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").slice(0, 15);
}

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date | null;
  details?: string | null;
  location?: string | null;
};

export function eventCalendarUrl({
  title,
  start,
  end,
  details,
  location,
}: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${calendarStamp(start)}/${calendarStamp(
      end ?? new Date(start.getTime() + HOUR_MS),
    )}`,
    ctz: TIME_ZONE,
  });
  if (details) params.set("details", details.slice(0, MAX_DETAILS_LENGTH));
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params}`;
}

function centerOffset(instant: Date) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    timeZoneName: "longOffset",
  })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;
  return name?.replace("GMT", "") || "+00:00";
}

function offsetMinutes(offset: string) {
  const [hours, minutes] = offset.slice(1).split(":").map(Number);
  return (offset.startsWith("-") ? -1 : 1) * (hours * 60 + minutes);
}

// Outlook has no time zone parameter, so the offset rides on the time. It is
// looked up twice because the stored date is not the real instant (DST nights).
function outlookStamp(date: Date) {
  const guess = centerOffset(date);
  const instant = new Date(date.getTime() - offsetMinutes(guess) * 60_000);
  return `${date.toISOString().slice(0, 19)}${centerOffset(instant)}`;
}

export function outlookCalendarUrl({
  title,
  start,
  end,
  details,
  location,
}: CalendarEvent) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: outlookStamp(start),
    enddt: outlookStamp(end ?? new Date(start.getTime() + HOUR_MS)),
  });
  if (details) params.set("body", details.slice(0, MAX_DETAILS_LENGTH));
  if (location) params.set("location", location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

export type CalendarLinks = { google: string; outlook: string; ics: string };

export function calendarLinks(
  event: CalendarEvent & { slug: string },
): CalendarLinks {
  return {
    google: eventCalendarUrl(event),
    outlook: outlookCalendarUrl(event),
    ics: `/api/events/${event.slug}/calendar.ics`,
  };
}

export type CalendarOption = {
  label: string;
  href: string;
  external?: boolean;
  download?: boolean;
};

// Apple Calendar and the plain download intentionally fetch the same .ics.
export function calendarOptions(
  links: CalendarLinks,
  labels: { google: string; apple: string; outlook: string; download: string },
): CalendarOption[] {
  return [
    { label: labels.google, href: links.google, external: true },
    { label: labels.apple, href: links.ics },
    { label: labels.outlook, href: links.outlook, external: true },
    { label: labels.download, href: links.ics, download: true },
  ];
}
