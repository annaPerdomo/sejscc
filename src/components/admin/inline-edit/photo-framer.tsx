"use client";

import { useRef, useState, type PointerEvent } from "react";
import { AdminButton } from "@/components/admin/admin-button";
import { SegmentedSwitch } from "@/components/admin/inline-edit/segmented-switch";
import {
  DEFAULT_FRAMING,
  draggedFraming,
  frameOverflow,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  clampPercent,
  clampZoom,
  framingStyle,
  isDefaultFraming,
  withFit,
  type PhotoFit,
  type PhotoFraming,
} from "@/lib/photo-framing";
import type { PhotoShape } from "@/lib/photo-slots";

export const PHOTO_SHAPE_CLASS: Record<PhotoShape, string> = {
  wide: "aspect-band",
  photo: "aspect-photo",
  square: "aspect-square",
};

export const NUDGE = 10;

type NaturalSize = { width: number; height: number };

function third(value: number): 0 | 1 | 2 {
  return value < 34 ? 0 : value < 67 ? 1 : 2;
}

const FIT_OPTIONS: { id: PhotoFit; label: string }[] = [
  { id: "fill", label: "Fill the space" },
  { id: "whole", label: "Show the whole picture" },
];

export function PhotoFitSwitch({
  framing,
  onChange,
}: {
  framing: PhotoFraming;
  onChange: (next: PhotoFraming) => void;
}) {
  return (
    <SegmentedSwitch
      label="This photo should:"
      value={framing.fit}
      options={FIT_OPTIONS}
      onChange={(fit) => onChange(withFit(framing, fit))}
    />
  );
}

export function framingLabel(framing: PhotoFraming): string {
  if (framing.fit === "whole") return "Showing the whole picture, with nothing cut off.";
  const zoom = framing.zoom === ZOOM_MIN ? "" : `, zoomed in to ${(framing.zoom / 100).toFixed(1)}×`;
  const xThird = third(framing.x);
  const yThird = third(framing.y);
  if (xThird === 1 && yThird === 1) return `Showing the middle of the photo${zoom}.`;
  const xDesc = ["the left", "the middle", "the right"][xThird];
  const yDesc = ["top", "middle", "bottom"][yThird];
  return `Showing the ${yDesc} of the photo, toward ${xDesc}${zoom}.`;
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
    const spill = frameOverflow(frameRef.current.getBoundingClientRect(), natural, framing);
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    onChange(draggedFraming({ ...framing, x: current.from.x, y: current.from.y }, spill, dx, dy));
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
        This is the part of the photo visitors will see. Fill the space and the edges that
        don&rsquo;t fit are cut off; show the whole picture and nothing is. Drag the photo or use
        the arrows to move it, and use the slider to zoom in.
      </p>
      <div className="mt-3">
        <PhotoFitSwitch framing={framing} onChange={(next) => !disabled && onChange(next)} />
      </div>

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
          <div
            className={`photo-frame ${framing.fit === "whole" ? "photo-frame-whole" : ""}`}
            style={framingStyle(framing)}
          >
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
              disabled={disabled || framing.fit === "whole"}
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
              Start over
            </AdminButton>
          )}
        </div>
      </div>
    </div>
  );
}
