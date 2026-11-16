export type PhotoCrop = { left: number; top: number; width: number; height: number };

export const CROP_FULL = 10000;
export const CROP_MIN = 500;

export const FULL_CROP: PhotoCrop = { left: 0, top: 0, width: CROP_FULL, height: CROP_FULL };

export function isPossibleCrop({ left, top, width, height }: PhotoCrop): boolean {
  return (
    [left, top, width, height].every(Number.isInteger) &&
    left >= 0 &&
    top >= 0 &&
    width >= CROP_MIN &&
    height >= CROP_MIN &&
    left + width <= CROP_FULL &&
    top + height <= CROP_FULL
  );
}

export function sameCrop(a: PhotoCrop, b: PhotoCrop): boolean {
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}

export function isFullCrop(crop: PhotoCrop): boolean {
  return sameCrop(crop, FULL_CROP);
}

type CropRow = {
  cropSource: string | null;
  cropLeft: number | null;
  cropTop: number | null;
  cropWidth: number | null;
  cropHeight: number | null;
};

export function cropFromRow(row: CropRow): { source: string; box: PhotoCrop } | undefined {
  const { cropSource, cropLeft, cropTop, cropWidth, cropHeight } = row;
  if (cropSource === null || cropLeft === null || cropTop === null || cropWidth === null || cropHeight === null) {
    return undefined;
  }
  return { source: cropSource, box: { left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight } };
}

export const NO_CROP_ROW: CropRow = {
  cropSource: null,
  cropLeft: null,
  cropTop: null,
  cropWidth: null,
  cropHeight: null,
};

export function cropToRow(source: string, box: PhotoCrop): CropRow {
  return { cropSource: source, cropLeft: box.left, cropTop: box.top, cropWidth: box.width, cropHeight: box.height };
}

export function cropPixels(
  natural: { width: number; height: number },
  crop: PhotoCrop
): { x: number; y: number; width: number; height: number } {
  const x = Math.min(natural.width - 1, Math.round((crop.left / CROP_FULL) * natural.width));
  const y = Math.min(natural.height - 1, Math.round((crop.top / CROP_FULL) * natural.height));
  const width = Math.max(1, Math.min(natural.width - x, Math.round((crop.width / CROP_FULL) * natural.width)));
  const height = Math.max(1, Math.min(natural.height - y, Math.round((crop.height / CROP_FULL) * natural.height)));
  return { x, y, width, height };
}

export type CropHandle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function movedSpan(start: number, length: number, delta: number): { start: number; length: number } {
  return { start: clamp(start + delta, 0, CROP_FULL - length), length };
}

function trimmedSpan(
  start: number,
  length: number,
  delta: number,
  movesStart: boolean
): { start: number; length: number } {
  if (movesStart) {
    const end = start + length;
    const nextStart = clamp(start + delta, 0, end - CROP_MIN);
    return { start: nextStart, length: end - nextStart };
  }
  return { start, length: clamp(length + delta, CROP_MIN, CROP_FULL - start) };
}

export function draggedCrop(from: PhotoCrop, handle: CropHandle, dx: number, dy: number): PhotoCrop {
  const stepX = Math.round(dx);
  const stepY = Math.round(dy);
  const horizontal =
    handle === "move"
      ? movedSpan(from.left, from.width, stepX)
      : handle.includes("e") || handle.includes("w")
        ? trimmedSpan(from.left, from.width, stepX, handle.includes("w"))
        : { start: from.left, length: from.width };
  const vertical =
    handle === "move"
      ? movedSpan(from.top, from.height, stepY)
      : handle.includes("n") || handle.includes("s")
        ? trimmedSpan(from.top, from.height, stepY, handle.includes("n"))
        : { start: from.top, length: from.height };
  return { left: horizontal.start, top: vertical.start, width: horizontal.length, height: vertical.length };
}
