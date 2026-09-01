import { TIME_ZONE } from "@/lib/calendars";

// Apple Calendar and Outlook resolve TZID against the file, not a system
// database, so the US DST rules in force since 2007 have to travel with it.
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TIME_ZONE}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0800",
  "TZOFFSETTO:-0700",
  "TZNAME:PDT",
  "DTSTART:20070311T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0700",
  "TZOFFSETTO:-0800",
  "TZNAME:PST",
  "DTSTART:20071104T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

const HOUR_MS = 60 * 60 * 1000;

// Stored as LA wall clock behind a fake UTC marker, so TZID replaces the "Z".
function localStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").slice(0, 15);
}

function utcStamp(date: Date) {
  return `${date.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/[;,]/g, (match) => `\\${match}`)
    .replace(/\r\n|[\r\n]/g, "\\n");
}

// RFC 5545 caps a line at 75 octets; continuations start with one space.
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  const decoder = new TextDecoder();
  for (let i = 0; i < bytes.length; ) {
    const limit = chunks.length === 0 ? 75 : 74;
    let size = Math.min(limit, bytes.length - i);
    // Never split a multi-byte character: 0b10xxxxxx is a continuation byte.
    while (size > 1 && (bytes[i + size] & 0xc0) === 0x80) size -= 1;
    chunks.push(decoder.decode(bytes.slice(i, i + size)));
    i += size;
  }
  return chunks.join("\r\n ");
}

export function buildEventIcs({
  uid,
  title,
  start,
  end,
  stamp,
  description,
  location,
  url,
}: {
  uid: string;
  title: string;
  start: Date;
  end: Date | null;
  stamp: Date;
  description?: string | null;
  location?: string | null;
  url?: string | null;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SEJSCC//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(stamp)}`,
    `DTSTART;TZID=${TIME_ZONE}:${localStamp(start)}`,
    `DTEND;TZID=${TIME_ZONE}:${localStamp(end ?? new Date(start.getTime() + HOUR_MS))}`,
    `SUMMARY:${escapeText(title)}`,
    ...(description ? [`DESCRIPTION:${escapeText(description)}`] : []),
    ...(location ? [`LOCATION:${escapeText(location)}`] : []),
    // URL is typed URI, not TEXT — escaping it would corrupt the link.
    ...(url ? [`URL:${url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(fold).join("\r\n")}\r\n`;
}
