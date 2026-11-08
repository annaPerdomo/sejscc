"use client";

import { useRef, useState, type PointerEvent } from "react";
import { AdminButton } from "@/components/admin/admin-button";
import {
  DEFAULT_FRAMING,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  clampPercent,
  clampZoom,
  framingStyle,
  isDefaultFraming,
  type PhotoFraming,
} from "@/lib/photo-framing";
import type { PhotoShape } from "@/lib/photo-slots";

export const PHOTO_SHAPE_CLASS: Record<PhotoShape, string> = {
  wide: "aspect-band",
  photo: "aspect-photo",
  square: "aspect-square",
};

const NUDGE = 10;

type NaturalSize = { width: number; height: number };

function third(value: number): 0 | 1 | 2 {
  return value < 34 ? 0 : value < 67 ? 1 : 2;
}

function framingLabel(framing: PhotoFraming): string {
  const zoom = framing.zoom === ZOOM_MIN ? "" : `, zoomed in to ${(framing.zoom / 100).toFixed(1)}×`;
  const xThird = third(framing.x);
  const yThird = third(framing.y);
  if (xThird === 1 && yThird === 1) return `Showing the middle of the photo${zoom}.`;
  const xDesc = ["the left", "the middle", "the right"][xThird];
  const yDesc = ["top", "middle", "bottom"][yThird];
  return `Showing the ${yDesc} of the photo, toward ${xDesc}${zoom}.`;
}

// Dragging the full overflow of the covered image moves the focus from 0 to 100.
function overflow(frame: DOMRect, natural: NaturalSize, zoom: number) {
  const scale = Math.max(frame.width / natural.width, frame.height / natural.height) * (zoom / 100);
  return {
    x: natural.width * scale - frame.width,
    y: natural.height * scale - frame.height,
  };
}

export function PhotoFramer({
  src,
  shape,
  framing,
  onChange,
  disabled = false,
}: {
  src: string;
  shape: PhotoShape;
  framing: PhotoFraming;
  onChange: (next: PhotoFraming) => void;
  disabled?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<NaturalSize | null>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; from: PhotoFraming } | null>(
    null
  );

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || !natural) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, from: framing };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId || !natural || !frameRef.current) return;
    const spill = overflow(frameRef.current.getBoundingClientRect(), natural, framing.zoom);
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    onChange({
      ...framing,
      x: spill.x > 0 ? clampPercent(current.from.x - (dx / spill.x) * 100) : framing.x,
      y: spill.y > 0 ? clampPercent(current.from.y - (dy / spill.y) * 100) : framing.y,
    });
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function nudge(dx: number, dy: number) {
    onChange({ ...framing, x: clampPercent(framing.x + dx), y: clampPercent(framing.y + dy) });
  }

  const arrows = [
    { label: "Up", arrow: "↑", place: "col-start-2", move: () => nudge(0, -NUDGE) },
    { label: "Left", arrow: "←", place: "col-start-1", move: () => nudge(-NUDGE, 0) },
    { label: "Right", arrow: "→", place: "col-start-3", move: () => nudge(NUDGE, 0) },
    { label: "Down", arrow: "↓", place: "col-start-2", move: () => nudge(0, NUDGE) },
  ];

  return (
    <div role="group" aria-labelledby="photo-framer-heading">
      <h3 id="photo-framer-heading" className="text-lg font-semibold text-ink">
        Choose what shows
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        This is the part of the photo visitors will see. Drag the photo to move it, use the
        arrows to look further up, down, left or right, and use the slider to zoom in.
      </p>

      <div className="mt-3 grid gap-5 sm:grid-cols-2 sm:items-start">
        <div
          ref={frameRef}
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className={`relative w-full touch-none overflow-clip rounded-lg bg-mist select-none ${
            disabled ? "" : "cursor-move"
          } ${PHOTO_SHAPE_CLASS[shape]}`}
        >
          <div className="photo-frame" style={framingStyle(framing)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={src}
              src={src}
              alt=""
              draggable={false}
              onLoad={(event) =>
                setNatural({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="space-y-4">
          <p role="status" aria-live="polite" className="text-sm text-ink-soft">
            {framingLabel(framing)}
          </p>
          <label className="block">
            <span className="font-semibold text-ink">Zoom</span>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={framing.zoom}
              disabled={disabled}
              onChange={(event) => onChange({ ...framing, zoom: clampZoom(Number(event.target.value)) })}
              className="mt-2 block h-11 w-full accent-indigo"
            />
          </label>
          <div className="grid w-full max-w-xs grid-cols-3 gap-2">
            {arrows.map(({ label, arrow, place, move }) => (
              <div key={label} className={`${place} grid`}>
                <AdminButton aria-disabled={disabled} onClick={() => !disabled && move()}>
                  <span aria-hidden="true" className="block text-xl leading-none">
                    {arrow}
                  </span>
                  {label}
                </AdminButton>
              </div>
            ))}
          </div>
          {!isDefaultFraming(framing) && (
            <AdminButton aria-disabled={disabled} onClick={() => !disabled && onChange(DEFAULT_FRAMING)}>
              Show the whole photo again
            </AdminButton>
          )}
        </div>
      </div>
    </div>
  );
}
