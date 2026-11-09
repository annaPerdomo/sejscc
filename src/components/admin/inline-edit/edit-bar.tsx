"use client";

import type { ReactNode } from "react";
import { SIGN_IN_AGAIN_MESSAGE } from "@/lib/admin-messages";
import type { Locale } from "@/lib/i18n";
import { SegmentedSwitch } from "./segmented-switch";

export type EditBarStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; message?: string }
  | { kind: "error"; message: string };

const LANGUAGE_OPTIONS: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
];

export function EditBar({
  lang,
  onLangChange,
  status,
  undo,
  viewSwitch,
  viewHref,
}: {
  lang: Locale;
  onLangChange: (lang: Locale) => void;
  status: EditBarStatus;
  undo?: { description: string; busy: boolean; onUndo: () => void };
  viewSwitch?: ReactNode;
  viewHref?: string;
}) {
  return (
    <div
      id="admin-edit-bar"
      tabIndex={-1}
      className="sticky top-0 z-20 border-b border-line bg-paper/95 px-4 py-2 text-ink outline-none backdrop-blur sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SegmentedSwitch label="Website shown in:" value={lang} options={LANGUAGE_OPTIONS} onChange={onLangChange} />
          {viewSwitch}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p aria-live="polite" className="min-h-6 text-base font-medium">
            {status.kind === "saving" && <span className="text-ink-soft">Saving…</span>}
            {status.kind === "saved" && (
              <span className="text-indigo-deep">
                ✓ {status.message ?? "Saved. Live on the website."}
              </span>
            )}
            {status.kind === "error" && (
              <span role="alert" className="text-magenta-deep">
                {status.message}
                {status.message === SIGN_IN_AGAIN_MESSAGE && (
                  <>
                    {" "}
                    <a
                      href="/admin/login"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center font-semibold text-navy underline"
                    >
                      Sign in again
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </>
                )}
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
                  {undo.busy ? "Undoing…" : "Undo this change"}
                </button>
              </span>
            )}
          </p>
          {viewHref && (
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-base font-semibold text-navy underline hover:text-indigo-deep"
            >
              View on the website
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
