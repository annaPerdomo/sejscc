export const CALENDAR_SPACES = [
  "gym",
  "dojo",
  "school",
  "rooms",
  "kitchen",
  "outdoors",
  "whole",
  "other",
] as const;

export type CalendarSpace = (typeof CALENDAR_SPACES)[number];

export type DayBooking = {
  id: string;
  title: string;
  /** Null for a booking that lasts the whole day. */
  time: string | null;
  location: string | null;
  space: CalendarSpace;
};

// Order matters: "Gym and Rooms 3 & 4" is a gym booking first.
const SPACE_PATTERNS: [CalendarSpace, RegExp][] = [
  ["whole", /whole|entire/i],
  ["gym", /gym|stage/i],
  ["dojo", /dojo/i],
  ["school", /school|gakuen/i],
  ["kitchen", /kitchen/i],
  ["outdoors", /parking|field|outside/i],
  ["rooms", /room/i],
];

export function spaceOf(location: string | null): CalendarSpace {
  if (!location) return "other";
  return SPACE_PATTERNS.find(([, pattern]) => pattern.test(location))?.[0] ?? "other";
}
