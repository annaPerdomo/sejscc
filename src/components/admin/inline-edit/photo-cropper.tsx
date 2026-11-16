"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { AdminAlert } from "@/components/admin/admin-alert";
import { buttonClass } from "@/components/admin/admin-button";
import { EditDialog } from "@/components/admin/inline-edit/edit-dialog";
import { confirmDiscardChanges } from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import {
  CROP_FULL,
  FULL_CROP,
  cropPixels,
  draggedCrop,
  isFullCrop,
  sameCrop,
  type CropHandle,
  type PhotoCrop,
} from "@/lib/photo-crop";
import { blurryPhotoMessage } from "@/lib/photo-resolution";
import { croppedPhotoFile } from "@/lib/photo-upload";
import type { PhotoShape } from "@/lib/photo-slots";

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";
const OPEN_FAILED_MESSAGE =
  "We couldn't open the original photo. Please close this and try again, or load the photo again with Change photo.";
const NOT_CROPPED_MESSAGE = "Drag the corners of the box first, or press Cancel.";
const UNCHANGED_MESSAGE = "The crop hasn't changed. Drag the box, or press Cancel.";
const CROP_FAILED_MESSAGE = "We couldn't crop that photo. Please try again.";
const KEY_STEP = 100;
const KEY_STEP_LARGE = 500;

type EdgeHandle = "n" | "s" | "e" | "w";

const EDGES: { handle: EdgeHandle; label: string; orientation: "vertical" | "horizontal"; place: string; cursor: string }[] = [
  { handle: "n", orientation: "vertical", label: "Top edge", place: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-ns-resize" },
  { handle: "s", orientation: "vertical", label: "Bottom edge", place: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "cursor-ns-resize" },
  { handle: "w", orientation: "horizontal", label: "Left edge", place: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
  { handle: "e", orientation: "horizontal", label: "Right edge", place: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
];

const CORNERS: { handle: CropHandle; place: string; cursor: string }[] = [
  { handle: "nw", place: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-nwse-resize" },
  { handle: "ne", place: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "cursor-nesw-resize" },
  { handle: "sw", place: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "cursor-nesw-resize" },
  { handle: "se", place: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "cursor-nwse-resize" },
];

const ARROW_STEPS: Record<EdgeHandle, Record<string, { dx: number; dy: number }>> = {
  n: { ArrowUp: { dx: 0, dy: -1 }, ArrowDown: { dx: 0, dy: 1 } },
  s: { ArrowUp: { dx: 0, dy: -1 }, ArrowDown: { dx: 0, dy: 1 } },
  w: { ArrowLeft: { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 } },
  e: { ArrowLeft: { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 } },
};

const HANDLE_ATTRIBUTE = "data-crop-handle";

const EDGE_PHRASE: Record<EdgeHandle, string> = {
  n: "the top",
  s: "the bottom",
  w: "the left",
  e: "the right",
};

function edgePercent(crop: PhotoCrop, handle: EdgeHandle): { position: number; text: string } {
  const position = {
    n: crop.top,
    s: crop.top + crop.height,
    w: crop.left,
    e: crop.left + crop.width,
  }[handle];
  const away = handle === "n" || handle === "w" ? position : CROP_FULL - position;
  return { position: percentOf(position), text: `${percentOf(away)}% from ${EDGE_PHRASE[handle]}` };
}
const CROP_HANDLES: readonly CropHandle[] = ["move", "n", "s", "e", "w", "ne", "nw", "se", "sw"];

function handleOf(target: EventTarget): CropHandle | null {
  if (!(target instanceof Element)) return null;
  const name = target.closest(`[${HANDLE_ATTRIBUTE}]`)?.getAttribute(HANDLE_ATTRIBUTE);
  return CROP_HANDLES.find((handle) => handle === name) ?? null;
}

function baseNameOf(source: string): string {
  const file = source.split(/[?#]/)[0].split("/").pop() ?? "";
  return file.replace(/\.[^.]+$/, "") || "photo";
}

function percentOf(units: number): number {
  return Math.round(units / (CROP_FULL / 100));
}

function PhotoCropperHandle() {
  return (
    <span className="flex size-11 items-center justify-center">
      <span className="size-4 rounded-full bg-white ring-2 ring-magenta" />
    </span>
  );
}

export function PhotoCropper({
  title,
  source,
  shape,
  saved,
  onSave,
  onRemove,
  onClose,
}: {
  title: string;
  source: string;
  shape: PhotoShape;
  saved: PhotoCrop | undefined;
  onSave: (file: File, crop: PhotoCrop) => Promise<void>;
  onRemove: (() => Promise<void>) | undefined;
  onClose: () => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [crop, setCrop] = useState<PhotoCrop>(saved ?? FULL_CROP);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const helpId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    handle: CropHandle;
    startX: number;
    startY: number;
    from: PhotoCrop;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loading = new Image();
    loading.crossOrigin = "anonymous";
    loading.onload = () => {
      if (!cancelled) setImage(loading);
    };
    loading.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    loading.src = source;
    return () => {
      cancelled = true;
    };
  }, [source]);

  const dirty = !sameCrop(crop, saved ?? FULL_CROP);
  const region = image && cropPixels({ width: image.naturalWidth, height: image.naturalHeight }, crop);
  const blurryMessage = region && blurryPhotoMessage(region, shape);
  const boxStyle = {
    left: `${crop.left / 100}%`,
    top: `${crop.top / 100}%`,
    width: `${crop.width / 100}%`,
    height: `${crop.height / 100}%`,
  };

  function change(next: PhotoCrop) {
    setCrop(next);
    setError(null);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    const handle = handleOf(event.target);
    if (!handle || saving) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX - rect.left,
      startY: event.clientY - rect.top,
      from: crop,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    const wrapper = wrapperRef.current;
    if (!current || current.pointerId !== event.pointerId || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dx = ((event.clientX - rect.left - current.startX) / rect.width) * CROP_FULL;
    const dy = ((event.clientY - rect.top - current.startY) / rect.height) * CROP_FULL;
    change(draggedCrop(current.from, current.handle, dx, dy));
  }

  function onPointerEnd(event: PointerEvent<HTMLElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function onEdgeKeyDown(handle: EdgeHandle, event: KeyboardEvent<HTMLButtonElement>) {
    const step = ARROW_STEPS[handle][event.key];
    if (!step || saving) return;
    event.preventDefault();
    const size = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    change(draggedCrop(crop, handle, step.dx * size, step.dy * size));
  }

  async function run(work: () => Promise<void>) {
    setSaving(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR);
      setSaving(false);
    }
  }

  async function removeCrop() {
    if (onRemove && !saving) await run(onRemove);
  }

  async function save() {
    if (!image || saving) return;
    if (isFullCrop(crop)) {
      if (onRemove) void removeCrop();
      else setError(NOT_CROPPED_MESSAGE);
      return;
    }
    if (saved && sameCrop(crop, saved)) {
      setError(UNCHANGED_MESSAGE);
      return;
    }
    await run(async () => {
      const file = await croppedPhotoFile(image, crop, baseNameOf(source));
      if (!file) throw new Error(CROP_FAILED_MESSAGE);
      await onSave(file, crop);
    });
  }

  function cancel() {
    if (!saving && confirmDiscardChanges(dirty)) onClose();
  }

  return (
    <EditDialog title={`Crop: ${title}`} open busy={saving} dirty={dirty} onClose={onClose}>
      <div className="space-y-5">
        {failed && <AdminAlert>{OPEN_FAILED_MESSAGE}</AdminAlert>}
        {!image && !failed && <p className="text-base text-ink-soft">Opening the photo…</p>}
        {image && (
          <>
            <div className="flex justify-center p-6">
              <div
                ref={wrapperRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                className="relative inline-block touch-none select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  crossOrigin="anonymous"
                  alt=""
                  draggable={false}
                  className="block max-h-96 w-auto max-w-full"
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
                  <div className="crop-box absolute" style={boxStyle} />
                </div>
                <div className="absolute" style={boxStyle}>
                  <div
                    aria-hidden="true"
                    data-crop-handle="move"
                    className="absolute inset-0 cursor-move"
                  />
                  {EDGES.map(({ handle, label, place, cursor, orientation }) => (
                    <button
                      key={handle}
                      type="button"
                      role="slider"
                      aria-label={label}
                      aria-orientation={orientation}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={edgePercent(crop, handle).position}
                      aria-valuetext={edgePercent(crop, handle).text}
                      aria-describedby={helpId}
                      disabled={saving}
                      onKeyDown={(event) => onEdgeKeyDown(handle, event)}
                      data-crop-handle={handle}
                      className={`absolute rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta ${place} ${cursor}`}
                    >
                      <PhotoCropperHandle />
                    </button>
                  ))}
                  {CORNERS.map(({ handle, place, cursor }) => (
                    <div
                      key={handle}
                      aria-hidden="true"
                      data-crop-handle={handle}
                      className={`absolute ${place} ${cursor}`}
                    >
                      <PhotoCropperHandle />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p role="status" aria-live="polite" className="text-sm text-ink-soft">
              Keeping {percentOf(crop.width)}% of the width and {percentOf(crop.height)}% of the height.
            </p>
            <p id={helpId} className="text-sm text-ink-soft">
              Drag the corners or edges of the box so it holds only the part you want to keep. The
              website keeps the original photo, so you can come back and change the crop any time.
              With a keyboard, move to an edge with Tab and press the arrow keys.
            </p>
          </>
        )}
        {blurryMessage && (
          <AdminAlert role="note" tone="warning">
            {blurryMessage}
          </AdminAlert>
        )}
        {error && <AdminAlert>{error}</AdminAlert>}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void save()}
            aria-disabled={saving || !image}
            className={`min-h-12 ${buttonClass("primary")}`}
          >
            {saving ? "Saving…" : "Save crop"}
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={() => void removeCrop()}
              aria-disabled={saving}
              className={`min-h-12 ${buttonClass("secondary")}`}
            >
              Show the whole photo again
            </button>
          )}
          {!isFullCrop(crop) && (
            <button
              type="button"
              onClick={() => !saving && change(FULL_CROP)}
              aria-disabled={saving}
              className={`min-h-12 ${buttonClass("secondary")}`}
            >
              Start over
            </button>
          )}
          <button
            type="button"
            onClick={cancel}
            aria-disabled={saving}
            className={`min-h-12 ${buttonClass("secondary")}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </EditDialog>
  );
}
