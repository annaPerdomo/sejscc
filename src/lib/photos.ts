import type { StaticImageData } from "next/image";
import type { SitePhotoSource } from "@/components/site-photo";

import history1925 from "../../public/photos/history-1925-nawa-ranch.jpg";
import history1930 from "../../public/photos/history-1930-dedication.jpg";
import history1936 from "../../public/photos/history-1936-agriculture-union.jpg";
import history1942 from "../../public/photos/history-1942-manzanar.jpg";
import history1965 from "../../public/photos/history-1965-kendo.jpg";
import history1977 from "../../public/photos/history-1977-dedication.jpg";
import history1994 from "../../public/photos/history-1994-groundbreaking.jpg";
import history2025 from "../../public/photos/history-2025-centennial.jpg";

export function photoFor(
  src: string | undefined,
  alt: string
): SitePhotoSource | undefined {
  return src ? { src, alt } : undefined;
}

export const homePhotos = {
  eventsBackdrop: "/campus-hero.jpg",
  /** Matches `home.japaneseSchool.slides`. */
  schoolSlides: [
    "/photos/home-school-shuji-class.jpg",
    "/photos/home-school-1972-christmas.jpg",
    "/photos/home-school-1980-speech.jpg",
    "/photos/home-school-1984-undokai.jpg",
    "/photos/home-school-2001-christmas.jpg",
    "/photos/home-school-2005-undokai.jpg",
    "/photos/home-school-2018-ohanashikai.jpg",
    "/photos/home-school-2024-undokai.jpg",
    "/photos/home-school-2025-teachers-level.jpg",
  ],
  /** Matches `home.japaneseSchool.highlights`. */
  highlights: [
    "/photos/home-school-brush.jpg",
    "/photos/home-school-speech.jpg",
    "/photos/home-school-nengajo.jpg",
    "/photos/home-school-graduates.jpg",
  ],
  centennial: "/photos/home-centennial.jpg",
} as const;

// Keyed by `home.history.milestones[].id`, not by position: inserting a
// milestone would otherwise shift every later photo onto the wrong caption.
export const historyMilestonePhotos: Record<string, StaticImageData> = {
  "1925": history1925,
  "1930": history1930,
  "1936": history1936,
  "1942": history1942,
  "1962": history1965,
  "1977": history1977,
  "1994": history1994,
  "2025": history2025,
};

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
    "/photos/level-adult-online.jpg",
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

/** Matches `events.heroPhotoAlts`. */
export const eventsHeroPhotos = [
  "/photos/events-hero-1.jpg",
  "/photos/events-ondo-dancing.jpg",
  "/photos/events-bingo-night.jpg",
  "/photos/events-boutique.jpg",
  "/photos/events-odori-ondo.jpg",
  "/photos/events-festival-food.jpg",
] as const;

export const groupsHeroPhoto = "/photos/groups-hero-2.jpg";

export const donatePhotos = {
  /** Matches `payments.donateReasons`. */
  reasons: [
    "/photos/donate-dojo.jpg",
    "/photos/donate-cleanup.jpg",
    "/photos/donate-campus.jpg",
    "/photos/donate-classroom.jpg",
  ],
  /** Matches `payments.mosaicPhotoAlts`. */
  mosaic: [
    "/photos/donate-kendo.jpg",
    "/photos/donate-mochitsuki.jpg",
    "/photos/donate-kitchen.jpg",
    "/photos/donate-festival.jpg",
    "/photos/donate-kindergarten.jpg",
    "/photos/donate-community.jpg",
  ],
} as const;
