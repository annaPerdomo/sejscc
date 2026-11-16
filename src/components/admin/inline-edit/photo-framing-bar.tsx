"use client";

import { useEffect, useId, useRef } from "react";
import { AdminAlert } from "@/components/admin/admin-alert";
import { buttonClass, buttonVariantClass } from "@/components/admin/admin-button";
import { framingLabel, NUDGE, PhotoFitSwitch } from "@/components/admin/inline-edit/photo-framer";
import {
  DEFAULT_FRAMING,
  SIZE_MAX,
  SIZE_MIN,
  SIZE_STEP,
  WASH_STEP,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  clampPercent,
  clampZoom,
  isDefaultFraming,
  withSize,
  withWash,
  type PhotoFraming,
} from "@/lib/photo-framing";
import type { PagePlacement } from "@/components/admin/inline-edit/page-edit-framing";
import { blurryPhotoMessage } from "@/lib/photo-resolution";
import type { PhotoShape } from "@/lib/photo-slots";
import { useNaturalSize } from "@/components/admin/inline-edit/use-natural-size";

const MOVES = [
  { word: "Left", arrow: "←", dx: -NUDGE, dy: 0 },
  { word: "Right", arrow: "→", dx: NUDGE, dy: 0 },
  { word: "Up", arrow: "↑", dx: 0, dy: -NUDGE },
  { word: "Down", arrow: "↓", dx: 0, dy: NUDGE },
];

const STEPS = [
  { label: "Previous photo", direction: -1 },
  { label: "Next photo", direction: 1 },
] as const;

type StepScale = {
  name: string;
  less: string;
  more: string;
  value: number;
  min: number;
  max: number;
  step: number;
  locked: boolean;
  set: (value: number) => void;
};

function StepRow({ scale }: { scale: StepScale }) {
  function stepBy(steps: number) {
    const atEnd = steps < 0 ? scale.value <= scale.min : scale.value >= scale.max;
    if (!scale.locked && !atEnd) scale.set(scale.value + steps * scale.step);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-disabled={scale.locked || scale.value <= scale.min}
        onClick={() => stepBy(-2)}
        className={`${BIG_BUTTON} sm:flex-none`}
      >
        <span aria-hidden="true" className="text-2xl leading-none">
          −
        </span>
        {scale.less}
      </button>
      <label className="hidden min-w-0 flex-1 sm:block">
        <span className="sr-only">{scale.name}</span>
        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={scale.step}
          value={scale.value}
          disabled={scale.locked}
          onChange={(event) => scale.set(Number(event.target.value))}
          className="block h-12 w-full accent-indigo"
        />
      </label>
      <button
        type="button"
        aria-disabled={scale.locked || scale.value >= scale.max}
        onClick={() => stepBy(2)}
        className={`${BIG_BUTTON} sm:flex-none`}
      >
        <span aria-hidden="true" className="text-2xl leading-none">
          +
        </span>
        {scale.more}
      </button>
    </div>
  );
}

function sizeLabel(size: number): string {
  if (size === SIZE_MIN) return "Showing the whole picture in its frame beside the words.";
  if (size === SIZE_MAX) return "Showing the whole picture as wide as the top of the page.";
  return `Showing the whole picture, grown ${size}% of the way to full width.`;
}

const BIG_BUTTON = `flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-lg aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${buttonVariantClass("secondary")}`;

export function PhotoFramingBar({
  title,
  src,
  shape,
  framing,
  placement,
  saving,
  error,
  setSize,
  onChange,
  onSave,
  onSaveAll,
  onStep,
  onCancel,
}: {
  title: string;
  src: string;
  shape: PhotoShape;
  framing: PhotoFraming;
  /** What the page lets this photo do; null until the page has been measured. */
  placement: PagePlacement | null;
  saving: boolean;
  error: string | null;
  /** How many photos take turns in this spot, this one included. */
  setSize: number;
  onChange: (next: PhotoFraming) => void;
  onSave: () => void;
  onSaveAll: () => void;
  /** Moves on to the photo before (-1) or after (1) this one in its set. */
  onStep: (direction: -1 | 1) => void;
  onCancel: () => void;
}) {
  const headingId = useId();
  const setHintId = useId();
  const inSet = setSize > 1;
  const natural = useNaturalSize(src);
  const blurryMessage = natural && blurryPhotoMessage(natural, shape, framing.zoom);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function nudge(dx: number, dy: number) {
    if (saving) return;
    onChange({ ...framing, x: clampPercent(framing.x + dx), y: clampPercent(framing.y + dy) });
  }

  // A whole photo has nothing to zoom into, so the same row sets how big it is instead.
  const sizing = Boolean(placement?.sizable) && framing.fit === "whole";
  const scale: StepScale = sizing
    ? {
        name: "Picture size",
        less: "Smaller",
        more: "Bigger",
        value: framing.size,
        min: SIZE_MIN,
        max: SIZE_MAX,
        step: SIZE_STEP,
        locked: saving,
        set: (value: number) => onChange(withSize(framing, value)),
      }
    : {
        name: "Zoom",
        less: "Zoom out",
        more: "Zoom in",
        value: framing.zoom,
        min: ZOOM_MIN,
        max: ZOOM_MAX,
        step: ZOOM_STEP,
        locked: saving || framing.fit === "whole",
        set: (value: number) => onChange({ ...framing, zoom: clampZoom(value) }),
      };

  // The shade only shows once the photo has grown out from its frame and under it.
  const washRange = sizing && framing.size > SIZE_MIN ? placement?.wash : undefined;
  const shade: StepScale | undefined = washRange && {
    name: "Blue shade over the picture",
    less: "Less blue",
    more: "More blue",
    value: framing.wash || washRange.auto,
    min: washRange.min,
    max: washRange.auto,
    step: WASH_STEP,
    locked: saving,
    set: (value: number) => onChange(withWash(framing, value, washRange)),
  };

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="shrink-0 border-t border-line bg-paper px-4 pt-3 pb-safe-bottom text-ink sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h2 id={headingId} ref={headingRef} tabIndex={-1} className="font-display text-lg text-ink outline-none">
            Move or zoom: {title}
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSave}
              aria-disabled={saving}
              className={`min-h-12 ${buttonClass("primary")}`}
            >
              {saving ? "Saving…" : inSet ? "Save this photo" : "Save"}
            </button>
            {inSet && (
              <button
                type="button"
                onClick={onSaveAll}
                aria-disabled={saving}
                aria-describedby={setHintId}
                className={`min-h-12 ${buttonClass("secondary")}`}
              >
                Save for all {setSize} photos
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              aria-disabled={saving}
              className={`min-h-12 ${buttonClass("secondary")}`}
            >
              Cancel
            </button>
          </div>
        </div>

        {inSet && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p id={setHintId} className="max-w-3xl text-base text-ink-soft">
              {setSize} photos take turns here. “Save for all {setSize} photos” gives every one of them this same look.
              You can still adjust any one on its own afterwards. “Previous photo” and “Next photo” save what you
              changed on this one, then show you another.
            </p>
            <div className="flex flex-wrap gap-3">
              {STEPS.map(({ label, direction }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onStep(direction)}
                  aria-disabled={saving}
                  className={`min-h-12 ${buttonClass("secondary")}`}
                >
                  {direction === -1 && <span aria-hidden="true">← </span>}
                  {label}
                  {direction === 1 && <span aria-hidden="true"> →</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <PhotoFitSwitch framing={framing} onChange={(next) => !saving && onChange(next)} />

        <div className="grid gap-2 lg:grid-cols-2 lg:gap-x-10">
          <div className="flex flex-col gap-2">
            <StepRow scale={scale} />
            {shade && <StepRow scale={shade} />}
          </div>
          <div role="group" aria-label="Move the photo a little" className="grid grid-cols-2 gap-2 self-start sm:grid-cols-4">
            {MOVES.map(({ word, arrow, dx, dy }) => (
              <button
                key={word}
                type="button"
                aria-label={`Move ${word.toLowerCase()}`}
                aria-disabled={saving}
                onClick={() => nudge(dx, dy)}
                className={BIG_BUTTON}
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  {arrow}
                </span>
                <span aria-hidden="true">{word}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <p role="status" aria-live="polite" className="text-base text-ink-soft">
            {sizing ? sizeLabel(framing.size) : framingLabel(framing)}{" "}
            {sizing
              ? `Press Bigger or Smaller, or drag one of the round pink handles on the page.${
                  shade
                    ? ` ${
                        framing.wash ? "The blue shade has been pulled back off the picture." : "The blue shade is where it started."
                      } Less blue and More blue move it, or drag the handle on its edge.`
                    : ""
                } Drag the photo itself to move it.`
              : "Drag the photo on the page to move it, or use the buttons."}
          </p>
          {!isDefaultFraming(framing) && (
            <button
              type="button"
              aria-label="Start over: fill the space with the middle of the photo"
              aria-disabled={saving}
              onClick={() => !saving && onChange(DEFAULT_FRAMING)}
              className={`min-h-11 ${buttonClass("secondary")}`}
            >
              Start over
            </button>
          )}
        </div>
        {blurryMessage && (
          <AdminAlert role="note" tone="warning">
            {blurryMessage}
          </AdminAlert>
        )}
        {error && <AdminAlert>{error}</AdminAlert>}
      </div>
    </div>
  );
}
