import type { SitePhotoSource } from "@/components/site-photo";
import type { Dictionary } from "@/lib/dictionaries";
import { TIME_ZONE } from "@/lib/calendars";

type YearCopy = Dictionary["school"]["year"];
export type SeasonId = keyof YearCopy["seasons"];

export type SchoolYearEventInput = {
  id: string;
  month: number;
  abbr: string;
  termJa: string;
  gloss: string;
  label: string;
  when: string;
  title: string;
  description: string;
  photo: SitePhotoSource | undefined;
};

export type SchoolEvent = SchoolYearEventInput & {
  photo: SitePhotoSource;
  season: YearCopy["seasons"][SeasonId] & { id: SeasonId };
};

// The Japanese reckoning, with each season's months in the order they fall.
const SEASON_MONTHS: { id: SeasonId; months: number[] }[] = [
  { id: "spring", months: [3, 4, 5] },
  { id: "summer", months: [6, 7, 8] },
  { id: "autumn", months: [9, 10, 11] },
  { id: "winter", months: [12, 1, 2] },
];

export function seasonIdForMonth(month: number): SeasonId {
  return SEASON_MONTHS.find((season) => season.months.includes(month))?.id ?? "spring";
}

export function monthOrderInSeason(month: number): number {
  const index = SEASON_MONTHS.find((season) => season.months.includes(month))?.months.indexOf(month);
  return index ?? 0;
}

function monthAtCenter(date: Date) {
  return Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: TIME_ZONE }).format(date));
}

/** Drops events without a photo; `currentIndex` is the one most recently held. */
export function buildSchoolYear(
  seasons: YearCopy["seasons"],
  inputs: SchoolYearEventInput[],
  today: Date
) {
  const month = monthAtCenter(today);

  const events: SchoolEvent[] = SEASON_MONTHS.flatMap(({ id, months }) =>
    months.flatMap((m) =>
      inputs.flatMap((input) =>
        input.month === m && input.photo
          ? [{ ...input, photo: input.photo, season: { ...seasons[id], id } }]
          : []
      )
    )
  );

  const monthsSince = (event: SchoolEvent) => (month - event.month + 12) % 12;
  const currentIndex = events.reduce(
    (latest, event, i) => (monthsSince(event) < monthsSince(events[latest]) ? i : latest),
    0
  );

  return { events, currentIndex };
}
