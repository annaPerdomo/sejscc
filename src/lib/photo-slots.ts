import {
  donatePhotos,
  eventsPhotos,
  groupsPhotos,
  homePhotos,
  schoolPhotos,
} from "@/lib/photos";

export type PhotoShape = "wide" | "photo" | "square";

export type PhotoPageId = "home" | "school" | "events" | "groups" | "donate";

export type PhotoSlot = {
  id: string;
  page: PhotoPageId;
  section: string;
  group: string;
  label: string;
  defaultSrc: string;
  defaultAltPath: string | null;
  shape: PhotoShape;
};

function slide(n: number): string {
  return `Slide ${n + 1}`;
}

function photoN(n: number): string {
  return `Photo ${n + 1}`;
}

export const PHOTO_SLOTS: PhotoSlot[] = [
  {
    id: "home.events-backdrop",
    page: "home",
    section: "home-top",
    group: "Backdrops",
    label: "Events and history backdrop",
    defaultSrc: homePhotos.eventsBackdrop,
    defaultAltPath: null,
    shape: "wide",
  },
  ...homePhotos.schoolSlides.map(
    (defaultSrc, i): PhotoSlot => ({
      id: `home.school-slide.${i}`,
      page: "home",
      section: "home-japanese-school",
      group: "Japanese School slideshow",
      label: slide(i),
      defaultSrc,
      defaultAltPath: `home.japaneseSchool.slides.${i}.alt`,
      shape: "photo",
    })
  ),
  ...homePhotos.highlights.map(
    (defaultSrc, i): PhotoSlot => ({
      id: `home.school-highlight.${i}`,
      page: "home",
      section: "home-japanese-school",
      group: "Japanese School highlights",
      label: photoN(i),
      defaultSrc,
      defaultAltPath: `home.japaneseSchool.highlights.${i}.photoAlt`,
      shape: "square",
    })
  ),
  {
    id: "home.centennial",
    page: "home",
    section: "home-history",
    group: "Centennial banner",
    label: "Banner photo",
    defaultSrc: homePhotos.centennial,
    defaultAltPath: "home.centennialPhotoAlt",
    shape: "wide",
  },
  {
    id: "school.hero",
    page: "school",
    section: "school-top",
    group: "Hero photo",
    label: "Main photo",
    defaultSrc: schoolPhotos.hero,
    defaultAltPath: "school.heroPhotoAlt",
    shape: "wide",
  },
  ...schoolPhotos.heroRotation.map(
    (defaultSrc, i): PhotoSlot => ({
      id: `school.hero-rotation.${i}`,
      page: "school",
      section: "school-top",
      group: "Hero photo",
      label: slide(i),
      defaultSrc,
      defaultAltPath: `school.heroRotationAlts.${i}`,
      shape: "wide",
    })
  ),
  {
    id: "school.join",
    page: "school",
    section: "school-join",
    group: "Join us",
    label: "Photo",
    defaultSrc: schoolPhotos.join,
    defaultAltPath: "school.join.photoAlt",
    shape: "wide",
  },
  {
    id: "school.then",
    page: "school",
    section: "school-then-now",
    group: "Then & now",
    label: "Then photo",
    defaultSrc: schoolPhotos.then,
    defaultAltPath: "school.history.thenPhotoAlt",
    shape: "wide",
  },
  {
    id: "school.now",
    page: "school",
    section: "school-then-now",
    group: "Then & now",
    label: "Now photo",
    defaultSrc: schoolPhotos.now,
    defaultAltPath: "school.history.nowPhotoAlt",
    shape: "wide",
  },
  ...eventsPhotos.reel.map(
    (defaultSrc, i): PhotoSlot => ({
      id: `events.reel.${i}`,
      page: "events",
      section: "events-top",
      group: "Photo reel",
      label: photoN(i),
      defaultSrc,
      defaultAltPath: `events.reel.photos.${i}.alt`,
      shape: "wide",
    })
  ),
  {
    id: "events.archive",
    page: "events",
    section: "events-past",
    group: "Past events",
    label: "Hero photo",
    defaultSrc: eventsPhotos.archive,
    defaultAltPath: "events.archive.heroPhotoAlt",
    shape: "wide",
  },
  {
    id: "groups.hero",
    page: "groups",
    section: "groups-top",
    group: "Hero photo",
    label: "Main photo",
    defaultSrc: groupsPhotos.hero,
    defaultAltPath: "groups.heroPhotoAlt",
    shape: "wide",
  },
  {
    id: "groups.start",
    page: "groups",
    section: "groups-start",
    group: "Start a club",
    label: "Photo",
    defaultSrc: groupsPhotos.start,
    defaultAltPath: "groups.usePhotoAlt",
    shape: "wide",
  },
  {
    id: "donate.hero",
    page: "donate",
    section: "donate-top",
    group: "Hero photo",
    label: "Main photo",
    defaultSrc: donatePhotos.hero,
    defaultAltPath: "payments.heroPhotoAlt",
    shape: "wide",
  },
  ...donatePhotos.reasons.map(
    (defaultSrc, i): PhotoSlot => ({
      id: `donate.reason.${i}`,
      page: "donate",
      section: "donate-reasons",
      group: "Why we need your support",
      label: photoN(i),
      defaultSrc,
      defaultAltPath: `payments.donateReasons.${i}.photoAlt`,
      shape: "photo",
    })
  ),
  ...donatePhotos.mosaic.map(
    (defaultSrc, i): PhotoSlot => ({
      id: `donate.mosaic.${i}`,
      page: "donate",
      section: "donate-mosaic",
      group: "Community mosaic",
      label: photoN(i),
      defaultSrc,
      defaultAltPath: `payments.mosaicPhotoAlts.${i}`,
      shape: "square",
    })
  ),
];

const SLOTS_BY_ID = new Map(PHOTO_SLOTS.map((slot) => [slot.id, slot]));

export function photoSlot(id: string): PhotoSlot | undefined {
  return SLOTS_BY_ID.get(id);
}
