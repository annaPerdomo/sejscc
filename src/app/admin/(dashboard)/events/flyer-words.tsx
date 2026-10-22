"use client";

import type { MouseEvent } from "react";
import {
  clampWords,
  NO_FLYER_STYLE,
  wordsFor,
  type FlyerLettering,
  type FlyerStyle,
} from "@/lib/flyer-compose";
import { FLYER_LAYOUTS, type FlyerLayout } from "@/lib/flyer-layouts";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminOptionTile } from "@/components/admin/admin-option-tile";
import { useLetteredPreviews } from "./use-lettered-previews";

export const FLYER_LAYOUT_NAMES: Record<FlyerLayout, { name: string; blurb: string }> = {
  band: { name: "Color strip", blurb: "The words on a strip of color across the picture" },
  badge: { name: "Strip and date square", blurb: "A color strip, plus the date in a square in the corner" },
  mat: { name: "Framed picture", blurb: "The picture in a gold frame, the words above or below it" },
  card: { name: "Card", blurb: "The words on a rounded card over the picture" },
  blossom: { name: "Plum blossom", blurb: "The words inside a big plum-blossom shape" },
};

const GRID_NAMES = [
  ["Top left", "Top", "Top right"],
  ["Left", "Middle", "Right"],
  ["Bottom left", "Bottom", "Bottom right"],
];

function third(value: number): 0 | 1 | 2 {
  return value < 34 ? 0 : value < 67 ? 1 : 2;
}

function snapThird(value: number): number {
  return [0, 50, 100][third(value)];
}

export function wordsPlaceLabel(layout: FlyerLayout, x: number, y: number): string {
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
  artUrl,
  lettering,
  style,
  previewUrl,
  updating,
  onChange,
}: {
  artUrl: string;
  lettering: FlyerLettering;
  style: FlyerStyle;
  previewUrl: string | null;
  updating: boolean;
  onChange: (next: FlyerStyle) => void;
}) {
  const where = wordsFor(artUrl, style);

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

  function nudge(dx: number, dy: number) {
    moveTo(where.x + dx, where.y + dy);
  }

  function onPreviewClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fx = clampWords(((event.clientX - rect.left) / rect.width) * 100);
    const fy = clampWords(((event.clientY - rect.top) / rect.height) * 100);
    const x = where.layout === "blossom" ? fx : snapThird(fx);
    const y = where.layout === "mat" ? (fy < 50 ? 0 : 100) : fy;
    moveTo(x, y);
  }

  const gridRows = (where.layout === "mat" ? [0, 2] : [0, 1, 2]).map((index) => index * 50);
  const yThird = where.layout === "mat" ? (where.y < 50 ? 0 : 2) : third(where.y);
  const xThird = third(where.x);

  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="font-semibold text-ink">Your flyer</h3>
      <p className="mt-1 text-sm text-stone">
        Choose where the words go and how they sit on the picture. The flyer
        updates as you go.
      </p>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 sm:items-start">
        <div>
          <div
            className="relative aspect-flyer w-full max-w-sm cursor-pointer"
            onClick={onPreviewClick}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Your flyer, with the words where they will print"
                className="h-full w-full rounded-lg border border-line bg-mist object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-line bg-mist text-sm text-stone">
                Drawing…
              </div>
            )}
          </div>
          {updating && (
            <p className="mt-2 text-sm text-ink-soft">Updating the picture…</p>
          )}
          <p className="mt-1 text-sm text-stone">
            Or tap the picture where you want the words.
          </p>
        </div>

        <div>
          <p role="status" aria-live="polite" className="text-base font-semibold text-ink">
            {wordsPlaceLabel(where.layout, where.x, where.y)}
          </p>

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-ink">
              Where should the words go?
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {gridRows.flatMap((rowY) =>
                [0, 50, 100].map((colX) => (
                  <AdminOptionTile
                    key={`${rowY}-${colX}`}
                    inputName="flyer-words-place"
                    name={GRID_NAMES[third(rowY)][third(colX)]}
                    checked={xThird === third(colX) && yThird === third(rowY)}
                    onSelect={() => moveTo(colX, rowY)}
                  />
                ))
              )}
            </div>
          </fieldset>

          {where.layout !== "mat" && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-ink">Move a little</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <AdminButton
                  aria-disabled={where.y <= 0}
                  onClick={() => {
                    if (where.y <= 0) return;
                    nudge(0, -5);
                  }}
                >
                  A little higher
                </AdminButton>
                <AdminButton
                  aria-disabled={where.y >= 100}
                  onClick={() => {
                    if (where.y >= 100) return;
                    nudge(0, 5);
                  }}
                >
                  A little lower
                </AdminButton>
                {where.layout === "blossom" && (
                  <>
                    <AdminButton
                      aria-disabled={where.x <= 0}
                      onClick={() => {
                        if (where.x <= 0) return;
                        nudge(-5, 0);
                      }}
                    >
                      A little left
                    </AdminButton>
                    <AdminButton
                      aria-disabled={where.x >= 100}
                      onClick={() => {
                        if (where.x >= 100) return;
                        nudge(5, 0);
                      }}
                    >
                      A little right
                    </AdminButton>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-ink">Layout</legend>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
                  <span className="flex h-full w-full items-center justify-center bg-mist text-xs text-stone">
                    Drawing…
                  </span>
                )}
              </span>
            </AdminOptionTile>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <AdminButton onClick={() => onChange(NO_FLYER_STYLE)}>
          Start this flyer over
        </AdminButton>
        <p className="mt-1 text-xs text-stone">
          Puts the layout and the words back to how they first looked with
          this picture.
        </p>
      </div>
    </div>
  );
}
