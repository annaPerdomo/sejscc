// Times are the venue's wall clock behind a fake UTC marker, as the site's own
// event times are, so a weekly 6 PM class stays at 6 PM across daylight saving.

export type FeedOccurrence = {
  uid: string;
  title: string;
  location: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
};

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

type WeekdayRule = { ordinal: number; weekday: number };

type Rule = {
  frequency: Frequency;
  interval: number;
  count: number | null;
  until: Date | null;
  byDay: WeekdayRule[];
  byMonth: number[];
  byMonthDay: number[];
  weekStart: number;
};

type FeedEvent = {
  uid: string;
  title: string;
  location: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  cancelled: boolean;
  rule: Rule | null;
  excluded: Set<number>;
  extra: Date[];
  replaces: number | null;
};

export type Feed = { events: FeedEvent[] };

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const FREQUENCIES: readonly string[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
// Rule parts this reader does not expand; an event using one shows only once.
const UNSUPPORTED_RULE_PARTS = ["BYSETPOS", "BYWEEKNO", "BYYEARDAY", "BYHOUR", "BYMINUTE"];
const MAX_RULE_STEPS = 5000;

const zoneFormatters = new Map<string, Intl.DateTimeFormat>();

function zoneOffsetMs(instant: Date, zone: string): number {
  let formatter = zoneFormatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    zoneFormatters.set(zone, formatter);
  }
  const parts = formatter.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
  return wall - Math.floor(instant.getTime() / 1000) * 1000;
}

// The offset is looked up twice because the first guess treats the wall clock
// as the instant, which is off by the offset itself near a clock change.
function instantFromWallClock(wall: number, zone: string): Date {
  const guess = new Date(wall - zoneOffsetMs(new Date(wall), zone));
  return new Date(wall - zoneOffsetMs(guess, zone));
}

type ParsedTime = { at: Date; allDay: boolean };

function parseTime(value: string, zone: string | null, venueZone: string): ParsedTime | null {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute, second, utc] = match;
  const naive = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour ?? 0),
    Number(minute ?? 0),
    Number(second ?? 0),
  );
  if (hour === undefined) return { at: new Date(naive), allDay: true };

  try {
    if (utc) {
      const instant = new Date(naive);
      return { at: new Date(naive + zoneOffsetMs(instant, venueZone)), allDay: false };
    }
    if (zone && zone !== venueZone) {
      const instant = instantFromWallClock(naive, zone);
      return {
        at: new Date(instant.getTime() + zoneOffsetMs(instant, venueZone)),
        allDay: false,
      };
    }
  } catch {
    // An unknown zone name: read the time as the venue's own wall clock.
  }
  return { at: new Date(naive), allDay: false };
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\([,;\\])/g, "$1")
    .trim();
}

function parseRule(value: string, venueZone: string): Rule | null {
  const parts = new Map(
    value.split(";").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.toUpperCase(), rest.join("=")] as const;
    }),
  );
  const frequency = parts.get("FREQ");
  if (!frequency || !FREQUENCIES.includes(frequency)) return null;
  if (UNSUPPORTED_RULE_PARTS.some((part) => parts.has(part))) return null;

  const byDay = (parts.get("BYDAY") ?? "")
    .split(",")
    .filter(Boolean)
    .map((token) => {
      const match = /^([+-]?\d+)?([A-Z]{2})$/.exec(token);
      return match
        ? { ordinal: Number(match[1] ?? 0), weekday: WEEKDAYS.indexOf(match[2]) }
        : null;
    });
  if (byDay.some((day) => !day || day.weekday < 0)) return null;

  const numbers = (key: string) =>
    (parts.get(key) ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter(Number.isInteger);

  const untilValue = parts.get("UNTIL");
  const until = untilValue ? parseTime(untilValue, null, venueZone) : null;
  const count = Number(parts.get("COUNT"));
  const weekStart = WEEKDAYS.indexOf(parts.get("WKST") ?? "MO");

  return {
    frequency: frequency as Frequency,
    interval: Math.max(1, Number(parts.get("INTERVAL")) || 1),
    count: Number.isInteger(count) && count > 0 ? count : null,
    until: until ? new Date(until.at.getTime() + (until.allDay ? DAY_MS - 1 : 0)) : null,
    byDay: byDay.filter((day): day is WeekdayRule => day !== null),
    byMonth: numbers("BYMONTH"),
    byMonthDay: numbers("BYMONTHDAY"),
    weekStart: weekStart < 0 ? 1 : weekStart,
  };
}

type Line = { name: string; params: Map<string, string>; value: string };

function parseLine(raw: string): Line | null {
  const colon = raw.indexOf(":");
  if (colon < 0) return null;
  const [name, ...params] = raw.slice(0, colon).split(";");
  return {
    name: name.toUpperCase(),
    params: new Map(
      params.map((param) => {
        const [key, ...rest] = param.split("=");
        return [key.toUpperCase(), rest.join("=").replace(/^"|"$/g, "")] as const;
      }),
    ),
    value: raw.slice(colon + 1),
  };
}

function readEvent(lines: Line[], venueZone: string): FeedEvent | null {
  const time = (line: Line) => parseTime(line.value, line.params.get("TZID") ?? null, venueZone);
  const times = (line: Line) =>
    line.value
      .split(",")
      .map((value) => parseTime(value, line.params.get("TZID") ?? null, venueZone))
      .filter((parsed): parsed is ParsedTime => parsed !== null);

  let uid = "";
  let title = "";
  let location: string | null = null;
  let start: ParsedTime | null = null;
  let end: ParsedTime | null = null;
  let cancelled = false;
  let rule: Rule | null = null;
  let replaces: number | null = null;
  const excluded = new Set<number>();
  const extra: Date[] = [];

  for (const line of lines) {
    switch (line.name) {
      case "UID":
        uid = line.value.trim();
        break;
      case "SUMMARY":
        title = unescapeText(line.value);
        break;
      case "LOCATION":
        location = unescapeText(line.value) || null;
        break;
      case "DTSTART":
        start = time(line);
        break;
      case "DTEND":
        end = time(line);
        break;
      case "STATUS":
        cancelled = line.value.trim().toUpperCase() === "CANCELLED";
        break;
      case "RRULE":
        rule = parseRule(line.value.trim(), venueZone);
        break;
      case "EXDATE":
        for (const parsed of times(line)) excluded.add(parsed.at.getTime());
        break;
      case "RDATE":
        for (const parsed of times(line)) extra.push(parsed.at);
        break;
      case "RECURRENCE-ID":
        replaces = time(line)?.at.getTime() ?? null;
        break;
    }
  }

  if (!uid || !start) return null;
  const fallbackEnd = new Date(start.at.getTime() + (start.allDay ? DAY_MS : 0));
  return {
    uid,
    title,
    location,
    start: start.at,
    end: end && end.at > start.at ? end.at : fallbackEnd,
    allDay: start.allDay,
    cancelled,
    rule,
    excluded,
    extra,
    replaces,
  };
}

export function parseFeed(text: string, venueZone: string): Feed {
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: FeedEvent[] = [];
  let current: Line[] | null = null;
  let nestedDepth = 0;

  for (const raw of lines) {
    if (raw === "BEGIN:VEVENT") {
      current = [];
      nestedDepth = 0;
    } else if (raw === "END:VEVENT") {
      const event = current && readEvent(current, venueZone);
      if (event) events.push(event);
      current = null;
    } else if (current && raw.startsWith("BEGIN:")) {
      nestedDepth++;
    } else if (current && nestedDepth > 0 && raw.startsWith("END:")) {
      nestedDepth--;
    } else if (current && nestedDepth === 0) {
      const line = parseLine(raw);
      if (line) current.push(line);
    }
  }
  return { events };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function matchingDays(year: number, month: number, { ordinal, weekday }: WeekdayRule): number[] {
  const total = daysInMonth(year, month);
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const first = 1 + ((weekday - firstWeekday + 7) % 7);
  const all: number[] = [];
  for (let day = first; day <= total; day += 7) all.push(day);
  if (ordinal === 0) return all;
  const picked = ordinal > 0 ? all[ordinal - 1] : all[all.length + ordinal];
  return picked === undefined ? [] : [picked];
}

function daysOfMonth(year: number, month: number, rule: Rule, startDay: number): number[] {
  const total = daysInMonth(year, month);
  if (rule.byDay.length > 0) return rule.byDay.flatMap((day) => matchingDays(year, month, day));
  if (rule.byMonthDay.length > 0) {
    return rule.byMonthDay
      .map((day) => (day < 0 ? total + 1 + day : day))
      .filter((day) => day >= 1 && day <= total);
  }
  return startDay <= total ? [startDay] : [];
}

type Period = { floor: Date; starts: Date[] };

function period(start: Date, rule: Rule, step: number): Period {
  const timeOfDay = start.getTime() % DAY_MS;
  const at = (year: number, month: number, day: number) =>
    new Date(Date.UTC(year, month, day) + timeOfDay);
  const jump = step * rule.interval;

  switch (rule.frequency) {
    case "DAILY": {
      const day = addDays(start, jump);
      const allowed =
        rule.byDay.length === 0 || rule.byDay.some((d) => d.weekday === day.getUTCDay());
      return { floor: day, starts: allowed ? [day] : [] };
    }
    case "WEEKLY": {
      const intoWeek = (start.getUTCDay() - rule.weekStart + 7) % 7;
      const week = addDays(start, jump * 7 - intoWeek);
      const weekdays =
        rule.byDay.length > 0 ? rule.byDay.map((d) => d.weekday) : [start.getUTCDay()];
      return {
        floor: week,
        starts: weekdays.map((weekday) => addDays(week, (weekday - rule.weekStart + 7) % 7)),
      };
    }
    case "MONTHLY": {
      const index = start.getUTCFullYear() * 12 + start.getUTCMonth() + jump;
      const year = Math.floor(index / 12);
      const month = index % 12;
      return {
        floor: new Date(Date.UTC(year, month, 1)),
        starts: daysOfMonth(year, month, rule, start.getUTCDate()).map((day) =>
          at(year, month, day),
        ),
      };
    }
    case "YEARLY": {
      const year = start.getUTCFullYear() + jump;
      const months = rule.byMonth.length > 0 ? rule.byMonth.map((m) => m - 1) : [start.getUTCMonth()];
      return {
        floor: new Date(Date.UTC(year, 0, 1)),
        starts: months.flatMap((month) =>
          daysOfMonth(year, month, rule, start.getUTCDate()).map((day) => at(year, month, day)),
        ),
      };
    }
  }
}

const PERIOD_DAYS: Partial<Record<Frequency, number>> = { DAILY: 1, WEEKLY: 7 };

// Without COUNT nothing before `from` needs counting, so short periods skip
// ahead instead of spending the step budget on years of past occurrences.
function firstStep(event: FeedEvent, rule: Rule, from: Date): number {
  const days = PERIOD_DAYS[rule.frequency];
  if (rule.count !== null || days === undefined) return 0;
  const periodMs = days * rule.interval * DAY_MS;
  return Math.max(0, Math.floor((from.getTime() - event.start.getTime()) / periodMs) - 1);
}

function ruleStarts(event: FeedEvent, rule: Rule, from: Date, before: Date): Date[] {
  const last = rule.until && rule.until < before ? rule.until : before;
  const starts: Date[] = [];
  const first = firstStep(event, rule, from);
  for (let step = first; step < first + MAX_RULE_STEPS; step++) {
    const { floor, starts: candidates } = period(event.start, rule, step);
    if (floor > last) break;
    candidates.sort((a, b) => a.getTime() - b.getTime());
    for (const candidate of candidates) {
      if (candidate < event.start) continue;
      if (candidate > last) return starts;
      starts.push(candidate);
      if (rule.count !== null && starts.length >= rule.count) return starts;
    }
  }
  return starts;
}

/** Every occurrence that overlaps `from` (inclusive) to `before` (exclusive), in order. */
export function occurrencesBetween(feed: Feed, from: Date, before: Date): FeedOccurrence[] {
  const replaced = new Map<string, Set<number>>();
  for (const event of feed.events) {
    if (event.replaces === null) continue;
    const starts = replaced.get(event.uid) ?? new Set<number>();
    starts.add(event.replaces);
    replaced.set(event.uid, starts);
  }

  const occurrences: FeedOccurrence[] = [];
  for (const event of feed.events) {
    if (event.cancelled) continue;
    const length = event.end.getTime() - event.start.getTime();
    const starts =
      event.replaces !== null || !event.rule
        ? [event.start, ...event.extra]
        : [...ruleStarts(event, event.rule, from, before), ...event.extra];
    const skipped = event.replaces === null ? replaced.get(event.uid) : undefined;

    for (const start of new Set(starts.map((s) => s.getTime()))) {
      if (event.excluded.has(start) || skipped?.has(start)) continue;
      const end = start + length;
      if (start >= before.getTime() || end <= from.getTime()) {
        if (!(length === 0 && start >= from.getTime() && start < before.getTime())) continue;
      }
      occurrences.push({
        uid: event.uid,
        title: event.title,
        location: event.location,
        start: new Date(start),
        end: new Date(end),
        allDay: event.allDay,
      });
    }
  }

  return occurrences.sort(
    (a, b) =>
      a.start.getTime() - b.start.getTime() ||
      Number(b.allDay) - Number(a.allDay) ||
      a.title.localeCompare(b.title),
  );
}
