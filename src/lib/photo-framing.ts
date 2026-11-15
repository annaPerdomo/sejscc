import type { CSSProperties } from "react";

export const PHOTO_FITS = ["fill", "whole"] as const;
export type PhotoFit = (typeof PHOTO_FITS)[number];

// `size` is how far a whole photo at the top of a page has grown from its
// frame beside the words (0) to the full width of the hero (100).
// `wash` is where the hero's blue shade stops over a grown photo: px (at a
// 16px root) from the left edge of the page's content, or 0 for the design's own place.
export type PhotoFraming = { x: number; y: number; zoom: number; fit: PhotoFit; size: number; wash: number };

// A site_photo row with this address keeps the spot's own photo and only
// stores how it is framed, so renaming a bundled photo can't orphan it.
export const ORIGINAL_PHOTO_URL = "";

// Marks a slide's own box inside a stage of slides and carries its fit, so the
// admin's framing tool can hide the stage's other slides and preview a change of fit.
export const PHOTO_SLIDE_ATTRIBUTE = "data-photo-slide";

// Set on a hero slide whose blue shade has been moved, alongside --photo-wash.
export const PHOTO_WASH_ATTRIBUTE = "data-photo-wash";

// Set on a frame once its photo's shape is known, alongside --photo-ratio.
export const PHOTO_RATIO_ATTRIBUTE = "data-photo-ratio";

export const ZOOM_MIN = 100;
export const ZOOM_MAX = 300;
export const ZOOM_STEP = 10;

export const SIZE_MIN = 0;
export const SIZE_MAX = 100;
export const SIZE_STEP = 10;

export const WASH_AUTO = 0;
export const WASH_MIN = 160;
export const WASH_MAX = 4000;
export const WASH_STEP = 40;

export const DEFAULT_FRAMING: PhotoFraming = {
  x: 50,
  y: 50,
  zoom: ZOOM_MIN,
  fit: "fill",
  size: SIZE_MIN,
  wash: WASH_AUTO,
};

export function sameFraming(a: PhotoFraming, b: PhotoFraming): boolean {
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom && a.fit === b.fit && a.size === b.size && a.wash === b.wash;
}

export function isDefaultFraming(framing: PhotoFraming): boolean {
  return sameFraming(framing, DEFAULT_FRAMING);
}

// A whole photo has nothing to zoom into; it can only slide within the room left around it.
export function withFit(framing: PhotoFraming, fit: PhotoFit): PhotoFraming {
  return fit === "whole" ? { ...DEFAULT_FRAMING, fit } : { ...framing, fit, size: SIZE_MIN, wash: WASH_AUTO };
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampSize(value: number): number {
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(value)));
}

const RIGHT_EDGE = 100;

// The photo grows leftward out of its frame, so one nobody has moved keeps to
// the right edge instead of drifting to the middle, under the words. Shrunk
// back into the frame, it goes back to the middle.
export function withSize(framing: PhotoFraming, size: number): PhotoFraming {
  const next = clampSize(size);
  if (framing.size === SIZE_MIN && framing.x === DEFAULT_FRAMING.x) return { ...framing, size: next, x: RIGHT_EDGE };
  if (next === SIZE_MIN && framing.x === RIGHT_EDGE) return { ...framing, size: next, x: DEFAULT_FRAMING.x };
  return { ...framing, size: next };
}

export function clampWash(value: number, min = WASH_MIN, max = WASH_MAX): number {
  return Math.min(max, Math.max(min, Math.round(value / 10) * 10));
}

export function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)));
}

type FramingRow = {
  focusX: number | null;
  focusY: number | null;
  zoom: number | null;
  fit: PhotoFit | null;
  size: number | null;
  wash: number | null;
};

export function framingFromRow(row: FramingRow): PhotoFraming | undefined {
  const { focusX, focusY, zoom, fit, size, wash } = row;
  if ([focusX, focusY, zoom, fit, size, wash].every((value) => value === null)) return undefined;
  return {
    x: row.focusX ?? DEFAULT_FRAMING.x,
    y: row.focusY ?? DEFAULT_FRAMING.y,
    zoom: row.zoom ?? DEFAULT_FRAMING.zoom,
    fit: row.fit ?? DEFAULT_FRAMING.fit,
    size: row.size ?? DEFAULT_FRAMING.size,
    wash: row.wash ?? DEFAULT_FRAMING.wash,
  };
}

export function framingToRow(framing: PhotoFraming | undefined): FramingRow {
  if (!framing || isDefaultFraming(framing)) {
    return { focusX: null, focusY: null, zoom: null, fit: null, size: null, wash: null };
  }
  return {
    focusX: framing.x,
    focusY: framing.y,
    zoom: framing.zoom,
    fit: framing.fit,
    size: framing.size,
    wash: framing.wash || null,
  };
}

export type FrameSize = { width: number; height: number };

// How far the photo spills past its frame. A whole photo is smaller than the
// frame on one side, so that side comes back negative: the room it can slide in.
export function frameOverflow(frame: FrameSize, natural: FrameSize, framing: PhotoFraming): FrameSize {
  const fill = Math.max(frame.width / natural.width, frame.height / natural.height) * (framing.zoom / 100);
  const whole = Math.min(frame.width / natural.width, frame.height / natural.height);
  const scale = framing.fit === "whole" ? whole : fill;
  return {
    width: natural.width * scale - frame.width,
    height: natural.height * scale - frame.height,
  };
}

const DRAG_SLACK_PX = 1;

export function draggedFraming(from: PhotoFraming, spill: FrameSize, dx: number, dy: number): PhotoFraming {
  return {
    ...from,
    x: Math.abs(spill.width) > DRAG_SLACK_PX ? clampPercent(from.x - (dx / spill.width) * 100) : from.x,
    y: Math.abs(spill.height) > DRAG_SLACK_PX ? clampPercent(from.y - (dy / spill.height) * 100) : from.y,
  };
}

const ROOT_PX = 16;

export function slideSizeStyle(framing: PhotoFraming | undefined): CSSProperties {
  return {
    "--photo-size": (framing?.size ?? SIZE_MIN) / SIZE_MAX,
    ...(framing?.wash ? { "--photo-wash": `${framing.wash / ROOT_PX}rem` } : {}),
  };
}

export function framingStyle(framing: PhotoFraming): CSSProperties {
  return {
    "--frame-x": `${framing.x}%`,
    "--frame-y": `${framing.y}%`,
    "--frame-zoom": framing.zoom / 100,
  };
}
