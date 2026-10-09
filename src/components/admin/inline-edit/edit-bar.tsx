"use client";

import { useId } from "react";
import type { Locale } from "@/lib/i18n";

export type EditBarStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; message?: string }
  | { kind: "error"; message: string };

export function EditBar({
  lang,
  onLangChange,
  status,
  undo,
  viewHref,
}: {
  lang: Locale;
  onLangChange: (lang: Locale) => void;
  status: EditBarStatus;
  undo?: { description: string; busy: boolean; onUndo: () => void };
  viewHref: string;
}) {
  const languageLabelId = useId();

  return (
    <div
      id="admin-edit-bar"
      tabIndex={-1}
      className="sticky top-0 z-20 border-b border-line bg-paper/95 px-4 py-2 text-ink outline-none backdrop-blur sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <p id={languageLabelId} className="font-display text-sm font-semibold tracking-wide text-ink-soft">
            Words shown in
          </p>
          <div
            role="group"
            aria-labelledby={languageLabelId}
            className="inline-flex rounded-full bg-mist p-1"
          >
            <button
              type="button"
              aria-pressed={lang === "en"}
              onClick={() => onLangChange("en")}
              className={`min-h-11 rounded-full px-4 font-display text-sm font-semibold ${
                lang === "en" ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              English
            </button>
            <button
              type="button"
              aria-pressed={lang === "ja"}
              onClick={() => onLangChange("ja")}
              className={`min-h-11 rounded-full px-4 font-display text-sm font-semibold ${
                lang === "ja" ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              日本語
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p aria-live="polite" className="min-h-6 text-sm font-medium">
            {status.kind === "saving" && <span className="text-ink-soft">Saving…</span>}
            {status.kind === "saved" && (
              <span className="text-indigo-deep">
                ✓ {status.message ?? "Saved. Live on the website."}
              </span>
            )}
            {status.kind === "error" && (
              <span role="alert" className="text-magenta-deep">
                {status.message}
              </span>
            )}
            {undo && (
              <span className="text-navy">
                {" "}
                <button
                  type="button"
                  onClick={undo.onUndo}
                  aria-disabled={undo.busy}
                  className="min-h-11 font-semibold underline hover:text-indigo-deep"
                >
                  {undo.busy ? "Undoing…" : "Undo"}
                </button>
              </span>
            )}
          </p>
          <a
            href={viewHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline hover:text-indigo-deep"
          >
            View on the website
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
