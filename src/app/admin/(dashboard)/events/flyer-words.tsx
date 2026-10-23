"use client";

import type { MouseEvent, RefObject } from "react";
import {
  clampWords,
  wordsFor,
  type FlyerLettering,
  type FlyerStyle,
} from "@/lib/flyer-compose";
import { FLYER_LAYOUTS, type FlyerLayout } from "@/lib/flyer-layouts";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminDisclosure } from "@/components/admin/admin-disclosure";
import { AdminOptionTile } from "@/components/admin/admin-option-tile";
import { useLetteredPreviews } from "./use-lettered-previews";

const FLYER_LAYOUT_NAMES: Record<FlyerLayout, { name: string; blurb: string }> = {
  band: { name: "Color strip", blurb: "The words on a strip of color across the picture" },
  badge: { name: "Strip and date square", blurb: "A color strip, plus the date in a square in the corner" },
  mat: { name: "Framed picture", blurb: "The picture in a gold frame, the words above or below it" },
  card: { name: "Card", blurb: "The words on a rounded card over the picture" },
  blossom: { name: "Plum blossom", blurb: "The words inside a big plum-blossom shape" },
};

const STEP = 25;
const THIRDS = [0, 50, 100];

function third(value: number): 0 | 1 | 2 {
  return value < 34 ? 0 : value < 67 ? 1 : 2;
}

function wordsPlaceLabel(layout: FlyerLayout, x: number, y: number): string {
  const xThird = third(x);
  const xDesc = ["on the left", "in the middle", "on the right"][xThird];
  if (layout === "mat") {
    const yDesc = y < 50 ? "above the picture" : "below the picture";
    return `The words are ${yDesc}, ${xDesc}.`;
  }
  const yThird = third(y);
  if (xThird === 1 && yThird === 1) return "The words are in the middle of the flyer.";
  const yDesc = ["at the top", "in the middle", "at the bottom"][yThird];
  return `The words are ${yDesc}, ${xDesc}.`;
}

export function FlyerWordsControls({
  headingRef,
  artUrl,
  lettering,
  style,
  previewUrl,
  updating,
  onChange,
  onChangePicture,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  artUrl: string;
  lettering: FlyerLettering;
  style: FlyerStyle;
  previewUrl: string | null;
  updating: boolean;
  onChange: (next: FlyerStyle) => void;
  onChangePicture: () => void;
}) {
  const where = wordsFor(artUrl, style);
  const framed = where.layout === "mat";
  const freeSideways = where.layout === "blossom";

  const layoutPreviews = useLetteredPreviews(
    FLYER_LAYOUTS.map((layout) => ({
      key: layout,
      artUrl,
      style: { layout, wordsX: style.wordsX, wordsY: style.wordsY },
    })),
    lettering
  );

  function moveTo(x: number, y: number) {
    onChange({ ...style, layout: where.layout, wordsX: clampWords(x), wordsY: clampWords(y) });
  }

  const canUp = framed ? where.y >= 50 : where.y > 0;
  const canDown = framed ? where.y < 50 : where.y < 100;
  const canLeft = freeSideways ? where.x > 0 : third(where.x) > 0;
  const canRight = freeSideways ? where.x < 100 : third(where.x) < 2;

  function moveUpDown(direction: -1 | 1) {
    const y = framed ? (direction < 0 ? 0 : 100) : where.y + direction * STEP;
    moveTo(where.x, y);
  }

  function moveSideways(direction: -1 | 1) {
    const x = freeSideways ? where.x + direction * STEP : THIRDS[third(where.x) + direction];
    moveTo(x, where.y);
  }

  function onPreviewClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fx = clampWords(((event.clientX - rect.left) / rect.width) * 100);
    const fy = clampWords(((event.clientY - rect.top) / rect.height) * 100);
    const x = freeSideways ? fx : THIRDS[third(fx)];
    const y = framed ? (fy < 50 ? 0 : 100) : fy;
    moveTo(x, y);
  }

  const arrows = [
    { label: "Up", arrow: "↑", place: "col-start-2", enabled: canUp, move: () => moveUpDown(-1) },
    { label: "Left", arrow: "←", place: "col-start-1", enabled: canLeft, move: () => moveSideways(-1) },
    { label: "Right", arrow: "→", place: "col-start-3", enabled: canRight, move: () => moveSideways(1) },
    { label: "Down", arrow: "↓", place: "col-start-2", enabled: canDown, move: () => moveUpDown(1) },
  ];

  return (
    <div className="mt-6">
      <h3 ref={headingRef} tabIndex={-1} className="font-display text-xl text-ink focus:outline-none">
        Your flyer
      </h3>
      <p className="mt-1 text-base text-ink-soft">
        This is how it will look. If you change the title, date or place, the
        flyer changes with it.
      </p>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 sm:items-start">
        <div>
          <div className="relative aspect-flyer w-full max-w-sm cursor-pointer" onClick={onPreviewClick}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Your flyer, with the words where they will print"
                className="h-full w-full rounded-lg border border-line bg-mist object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-line bg-mist text-base text-stone">
                Drawing…
              </div>
            )}
          </div>
          <p className="mt-2 min-h-5 text-sm text-ink-soft">{updating && "Updating the flyer…"}</p>
        </div>

        <div className="space-y-6">
          <AdminButton onClick={onChangePicture}>Choose a different picture</AdminButton>

          <div role="group" aria-labelledby="flyer-move-heading">
            <h4 id="flyer-move-heading" className="text-lg font-semibold text-ink">
              Move the words
            </h4>
            <p role="status" aria-live="polite" className="mt-1 text-base text-ink-soft">
              {wordsPlaceLabel(where.layout, where.x, where.y)}
            </p>
            <div className="mt-3 grid w-full max-w-xs grid-cols-3 gap-2">
              {arrows.map(({ label, arrow, place, enabled, move }) => (
                <div key={label} className={`${place} grid`}>
                  <AdminButton
                    aria-disabled={!enabled}
                    onClick={() => {
                      if (enabled) move();
                    }}
                  >
                    <span aria-hidden="true" className="block text-xl leading-none">
                      {arrow}
                    </span>
                    {label}
                  </AdminButton>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-stone">
              You can also tap the flyer where you want the words.
            </p>
          </div>
        </div>
      </div>

      <AdminDisclosure className="mt-6" summary="Try a different style for the words">
        <p className="mt-4 text-base text-ink-soft">
          Each one shows your picture with the words set a different way. Tap
          one to use it.
        </p>
        <fieldset className="mt-3">
          <legend className="sr-only">Style for the words</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FLYER_LAYOUTS.map((layout) => (
              <AdminOptionTile
                key={layout}
                inputName="flyer-layout"
                name={FLYER_LAYOUT_NAMES[layout].name}
                blurb={FLYER_LAYOUT_NAMES[layout].blurb}
                checked={where.layout === layout}
                onSelect={() => onChange({ ...style, layout })}
              >
                <span className="relative block aspect-flyer w-full">
                  {layoutPreviews[layout] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={layoutPreviews[layout]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-mist text-sm text-stone">
                      Drawing…
                    </span>
                  )}
                </span>
              </AdminOptionTile>
            ))}
          </div>
        </fieldset>
      </AdminDisclosure>

      <div className="mt-4">
        <AdminButton onClick={() => onChange({ ...style, wordsX: null, wordsY: null })}>
          Put the words back where they started
        </AdminButton>
      </div>
    </div>
  );
}
