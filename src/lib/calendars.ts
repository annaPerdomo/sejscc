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

export function eventCalendarUrl({
  title,
  start,
  end,
  details,
  location,
}: {
  title: string;
  start: Date;
  end: Date | null;
  details?: string | null;
  location?: string | null;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${calendarStamp(start)}/${calendarStamp(
      end ?? new Date(start.getTime() + HOUR_MS)
    )}`,
    ctz: TIME_ZONE,
  });
  if (details) params.set("details", details.slice(0, MAX_DETAILS_LENGTH));
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/render?${params}`;
}
