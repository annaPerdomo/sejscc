import { cache } from "react";
import { isUploadedFileUrl } from "@/lib/format";

export type ImageSize = { width: number; height: number };

// Only JPEG pushes its size marker back this far, and then only behind EXIF.
const HEADER_BYTES = 65_536;

// Blob URLs carry a random suffix, so a stored image never changes under one.
const FETCH_CACHE_SECONDS = 60 * 60 * 24;

// Runs while the detail page renders: a stalled host must fall back, not hang.
const FETCH_TIMEOUT_MS = 3000;

function readPng(view: DataView): ImageSize | null {
  if (view.getUint32(0) !== 0x89504e47) return null;
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

// Standalone markers and 0xFF fill bytes have no segment length to step over.
function readJpeg(view: DataView): ImageSize | null {
  if (view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    // SOF0-SOF15 carry the frame size; DHT/JPG/DAC share the range and don't.
    const isFrameHeader =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrameHeader) {
      return {
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      };
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function readWebp(view: DataView): ImageSize | null {
  if (view.getUint32(0) !== 0x52494646) return null; // "RIFF"
  if (view.getUint32(8) !== 0x57454250) return null; // "WEBP"

  const chunk = view.getUint32(12);
  if (chunk === 0x56503820) {
    // "VP8 " — lossy; sizes follow the 3-byte tag and 3-byte sync code.
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }
  if (chunk === 0x5650384c) {
    // "VP8L" — lossless; 14 bits each, minus one, packed after the signature.
    const bits = view.getUint32(21, true);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === 0x56503858) {
    // "VP8X" — extended; 24-bit little-endian canvas size, minus one.
    const at = (start: number) =>
      view.getUint8(start) |
      (view.getUint8(start + 1) << 8) |
      (view.getUint8(start + 2) << 16);
    return { width: at(24) + 1, height: at(27) + 1 };
  }
  return null;
}

// Never throws: any failure is null, and callers fall back to a fixed frame.
export const getImageSize = cache(
  async (url: string): Promise<ImageSize | null> => {
    if (!isUploadedFileUrl(url)) return null;
    try {
      const response = await fetch(url, {
        headers: { Range: `bytes=0-${HEADER_BYTES - 1}` },
        next: { revalidate: FETCH_CACHE_SECONDS },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) return null;

      const view = new DataView(await response.arrayBuffer());
      if (view.byteLength < 32) return null;

      const size = readPng(view) ?? readWebp(view) ?? readJpeg(view);
      if (!size || !size.width || !size.height) return null;
      return size;
    } catch (error) {
      console.error("Could not read image dimensions:", error);
      return null;
    }
  }
);
