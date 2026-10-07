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
import history2025Sign from "../../public/photos/history-2025-omedeto-sign.jpg";
import founderHayashi from "../../public/photos/history-founders-hayashi.jpg";
import founderKurai from "../../public/photos/history-founders-kurai.jpg";
import founderNawa from "../../public/photos/history-founders-nawa.jpg";
import album1973 from "../../public/photos/history-album-1973-attendance-award.jpg";
import album1977 from "../../public/photos/history-album-1977-gym-construction.jpg";
import album1994TiltUp from "../../public/photos/history-album-1994-tilt-up.jpg";
import album1994KagamiBiraki from "../../public/photos/history-album-1994-kagami-biraki.jpg";
import centennialHall from "../../public/photos/history-centennial-hall.jpg";
import centennialKanpai from "../../public/photos/history-centennial-kanpai.jpg";
import centennialBand from "../../public/photos/history-centennial-band.jpg";
import centennialKidsEating from "../../public/photos/history-centennial-kids-eating.jpg";
import centennialOldFriends from "../../public/photos/history-centennial-old-friends.jpg";
import centennialProclamation from "../../public/photos/history-centennial-proclamation.jpg";
import centennialFamily from "../../public/photos/history-centennial-family.jpg";
import centennialKagamiBiraki from "../../public/photos/history-centennial-kagami-biraki.jpg";
import centennialLaughter from "../../public/photos/history-centennial-laughter.jpg";
import centennialCrowd from "../../public/photos/history-centennial-crowd.jpg";
import board2025 from "../../public/photos/home-board-2025.jpg";

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
  "2025": history2025Sign,
};

export const boardPhoto: StaticImageData = board2025;

/** Keyed by `home.history.founders[].id`. */
export const historyFounderPhotos: Record<string, StaticImageData> = {
  nawa: founderNawa,
  hayashi: founderHayashi,
  kurai: founderKurai,
};

/** Keyed by `home.history.album[].id`. */
export const historyAlbumPhotos: Record<string, StaticImageData> = {
  "1973-attendance-award": album1973,
  "1977-gym-construction": album1977,
  "1994-tilt-up": album1994TiltUp,
  "1994-kagami-biraki": album1994KagamiBiraki,
};

/** Keyed by `home.history.centennialGallery[].id`. */
export const historyCentennialPhotos: Record<string, StaticImageData> = {
  "hall": centennialHall,
  "kanpai": centennialKanpai,
  "band": centennialBand,
  "kids-eating": centennialKidsEating,
  "history-displays": history2025,
  "old-friends": centennialOldFriends,
  "proclamation": centennialProclamation,
  "family": centennialFamily,
  "kagami-biraki": centennialKagamiBiraki,
  "laughter": centennialLaughter,
  "crowd": centennialCrowd,
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
