import type { SitePhotoSource } from "@/components/site-photo";

export function photoFor(
  src: string | undefined,
  alt: string
): SitePhotoSource | undefined {
  return src ? { src, alt } : undefined;
}

/** Keyed by `home.heroTabs[].id`. */
export const homeHeroPhotos: Record<string, string | undefined> = {
  center: "/campus-hero.jpg",
  school: "/photos/hero-school.jpg",
  clubs: "/photos/hero-clubs.jpg",
  about: "/photos/hero-about.jpg",
  donate: "/photos/hero-donate.jpg",
};

export const homePhotos = {
  japaneseSchool: "/photos/home-school.jpg",
  /** Matches `home.japaneseSchool.highlights`. */
  highlights: [
    "/photos/home-highlight-saturday.jpg",
    "/photos/home-highlight-levels.jpg",
    "/photos/home-highlight-adult.jpg",
    "/photos/home-highlight-events.jpg",
  ],
  history: "/photos/home-history.jpg",
  connect: "/photos/home-connect.jpg",
} as const;

export const schoolPhotos = {
  hero: [
    "/photos/school-hero-1.jpg",
    "/photos/school-hero-2.jpg",
    "/photos/school-hero-3.jpg",
    "/photos/school-hero-4.jpg",
  ],
  then: "/photos/school-then.jpg",
  now: "/photos/school-now.jpg",
  /** Matches `school.classes.levels`. */
  levels: [
    "/photos/level-kindergarten.jpg",
    "/photos/level-beginning.jpg",
    "/photos/level-elementary.jpg",
    "/photos/level-intermediate.jpg",
    "/photos/level-advanced.jpg",
    "/photos/level-adult.jpg",
    "/photos/level-shuji.jpg",
  ],
  /** Matches `school.year.months`. Hanami and Shichi-go-san have no photo yet. */
  months: [
    "/photos/month-oshogatsu.jpg",
    "/photos/month-setsubun.jpg",
    "/photos/month-hinamatsuri.jpg",
    undefined,
    "/photos/month-kodomonohi.jpg",
    "/photos/month-tanabata.jpg",
    "/photos/month-shigyo.jpg",
    "/photos/month-jugyosankan.jpg",
    "/photos/month-undokai.jpg",
    undefined,
    "/photos/month-toshikoshi.jpg",
  ],
} as const;

export const groupsHeroPhotos = [
  "/photos/groups-hero-1.jpg",
  "/photos/groups-hero-2.jpg",
  "/photos/groups-hero-3.jpg",
  "/photos/groups-hero-4.jpg",
];

export const eventsHeroPhotos = [
  "/photos/events-hero-1.jpg",
  "/photos/events-hero-2.jpg",
  "/photos/events-hero-3.jpg",
];

export const paymentsHeroPhotos = ["/photos/payments-hero-1.jpg"];
