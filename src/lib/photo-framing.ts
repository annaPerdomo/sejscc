import type { CSSProperties } from "react";

export type PhotoFraming = { x: number; y: number; zoom: number };

export const ZOOM_MIN = 100;
export const ZOOM_MAX = 300;
export const ZOOM_STEP = 10;

export const DEFAULT_FRAMING: PhotoFraming = { x: 50, y: 50, zoom: ZOOM_MIN };

export function isDefaultFraming(framing: PhotoFraming): boolean {
  return framing.x === 50 && framing.y === 50 && framing.zoom === ZOOM_MIN;
}

export function sameFraming(a: PhotoFraming, b: PhotoFraming): boolean {
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom;
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)));
}

export function framingFromRow(row: {
  focusX: number | null;
  focusY: number | null;
  zoom: number | null;
}): PhotoFraming | undefined {
  if (row.focusX === null && row.focusY === null && row.zoom === null) return undefined;
  return {
    x: row.focusX ?? DEFAULT_FRAMING.x,
    y: row.focusY ?? DEFAULT_FRAMING.y,
    zoom: row.zoom ?? DEFAULT_FRAMING.zoom,
  };
}

export function framingToRow(framing: PhotoFraming | undefined): {
  focusX: number | null;
  focusY: number | null;
  zoom: number | null;
} {
  if (!framing || isDefaultFraming(framing)) return { focusX: null, focusY: null, zoom: null };
  return { focusX: framing.x, focusY: framing.y, zoom: framing.zoom };
}

export function framingStyle(framing: PhotoFraming): CSSProperties {
  return {
    "--frame-x": `${framing.x}%`,
    "--frame-y": `${framing.y}%`,
    "--frame-zoom": framing.zoom / 100,
  };
}
