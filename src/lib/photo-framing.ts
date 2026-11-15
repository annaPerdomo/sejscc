import type { CSSProperties } from "react";

export const PHOTO_FITS = ["fill", "whole"] as const;
export type PhotoFit = (typeof PHOTO_FITS)[number];

// `size` is how far a whole photo at the top of a page has grown from its
// frame beside the words (0) to the full width of the hero (100).
export type PhotoFraming = { x: number; y: number; zoom: number; fit: PhotoFit; size: number };

// A site_photo row with this address keeps the spot's own photo and only
// stores how it is framed, so renaming a bundled photo can't orphan it.
export const ORIGINAL_PHOTO_URL = "";

// Marks a slide's own box inside a stage of slides and carries its fit, so the
// admin's framing tool can hide the stage's other slides and preview a change of fit.
export const PHOTO_SLIDE_ATTRIBUTE = "data-photo-slide";

// Set on a frame once its photo's shape is known, alongside --photo-ratio.
export const PHOTO_RATIO_ATTRIBUTE = "data-photo-ratio";

export const ZOOM_MIN = 100;
export const ZOOM_MAX = 300;
export const ZOOM_STEP = 10;

export const SIZE_MIN = 0;
export const SIZE_MAX = 100;
export const SIZE_STEP = 10;

export const DEFAULT_FRAMING: PhotoFraming = { x: 50, y: 50, zoom: ZOOM_MIN, fit: "fill", size: SIZE_MIN };

export function sameFraming(a: PhotoFraming, b: PhotoFraming): boolean {
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom && a.fit === b.fit && a.size === b.size;
}

export function isDefaultFraming(framing: PhotoFraming): boolean {
  return sameFraming(framing, DEFAULT_FRAMING);
}

// A whole photo has nothing to zoom into; it can only slide within the room left around it.
export function withFit(framing: PhotoFraming, fit: PhotoFit): PhotoFraming {
  return fit === "whole" ? { ...DEFAULT_FRAMING, fit } : { ...framing, fit, size: SIZE_MIN };
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

export function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)));
}

type FramingRow = {
  focusX: number | null;
  focusY: number | null;
  zoom: number | null;
  fit: PhotoFit | null;
  size: number | null;
};

export function framingFromRow(row: FramingRow): PhotoFraming | undefined {
  if (row.focusX === null && row.focusY === null && row.zoom === null && row.fit === null && row.size === null) {
    return undefined;
  }
  return {
    x: row.focusX ?? DEFAULT_FRAMING.x,
    y: row.focusY ?? DEFAULT_FRAMING.y,
    zoom: row.zoom ?? DEFAULT_FRAMING.zoom,
    fit: row.fit ?? DEFAULT_FRAMING.fit,
    size: row.size ?? DEFAULT_FRAMING.size,
  };
}

export function framingToRow(framing: PhotoFraming | undefined): FramingRow {
  if (!framing || isDefaultFraming(framing)) {
    return { focusX: null, focusY: null, zoom: null, fit: null, size: null };
  }
  return { focusX: framing.x, focusY: framing.y, zoom: framing.zoom, fit: framing.fit, size: framing.size };
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

export function slideSizeStyle(framing: PhotoFraming | undefined): CSSProperties {
  return { "--photo-size": (framing?.size ?? SIZE_MIN) / SIZE_MAX };
}

export function framingStyle(framing: PhotoFraming): CSSProperties {
  return {
    "--frame-x": `${framing.x}%`,
    "--frame-y": `${framing.y}%`,
    "--frame-zoom": framing.zoom / 100,
  };
}
