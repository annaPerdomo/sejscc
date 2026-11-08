import { ZOOM_MIN, ZOOM_STEP } from "@/lib/photo-framing";
import type { PhotoShape } from "@/lib/photo-slots";

export type PhotoSize = { width: number; height: number };

const SHARP_WIDTH: Record<PhotoShape, number> = {
  wide: 1600,
  photo: 1200,
  square: 800,
};

const WHERE_SMALL_COPIES_COME_FROM =
  "Photos sent by text message or saved from a website are usually the small kind. The original file from the camera or phone is usually large enough.";

function pixels(size: PhotoSize): string {
  return `${Math.round(size.width)} × ${Math.round(size.height)} pixels`;
}

function sharpSizeFor(natural: PhotoSize, shape: PhotoShape, zoom: number): PhotoSize {
  const width = (SHARP_WIDTH[shape] * zoom) / 100;
  return { width, height: (width * natural.height) / natural.width };
}

function sharpestZoom(natural: PhotoSize, shape: PhotoShape): number {
  const zoom = (natural.width / SHARP_WIDTH[shape]) * 100;
  return Math.floor(zoom / ZOOM_STEP) * ZOOM_STEP;
}

export function photoLooksBlurry(natural: PhotoSize, shape: PhotoShape, zoom = ZOOM_MIN): boolean {
  return (natural.width * 100) / zoom < SHARP_WIDTH[shape];
}

export function blurryPhotoMessage(natural: PhotoSize, shape: PhotoShape, zoom = ZOOM_MIN): string | null {
  if (!photoLooksBlurry(natural, shape, zoom)) return null;
  if (zoom > ZOOM_MIN && !photoLooksBlurry(natural, shape)) {
    const safeZoom = (sharpestZoom(natural, shape) / 100).toFixed(1);
    const neededAtThisZoom = pixels(sharpSizeFor(natural, shape, zoom));
    return `Zoomed in this far, this photo (${pixels(natural)}) will look blurry on larger screens. Zoom out to ${safeZoom}× or less, or use a copy of the photo that is at least ${neededAtThisZoom}.`;
  }
  const needed = pixels(sharpSizeFor(natural, shape, ZOOM_MIN));
  const zoomNote = zoom > ZOOM_MIN ? " Zooming in makes it blurrier still." : "";
  return `This photo is small (${pixels(natural)}), so it will look blurry on larger screens.${zoomNote} To look sharp here it needs to be at least ${needed}: the same photo, just a larger copy. ${WHERE_SMALL_COPIES_COME_FROM}`;
}
