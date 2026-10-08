"use client";

import type { Locale } from "@/lib/i18n";

export type EditBarStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function EditBar({
  lang,
  onLangChange,
  status,
}: {
  lang: Locale;
  onLangChange: (lang: Locale) => void;
  status: EditBarStatus;
}) {
  return (
    <div className="sticky top-0 z-20 bg-navy px-4 py-3 text-white sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="font-display text-sm font-semibold tracking-[0.04em]">
            Editing the home page
          </p>
          <div role="group" aria-label="Language" className="inline-flex rounded-lg border border-white/30 p-1">
            <button
              type="button"
              aria-pressed={lang === "en"}
              onClick={() => onLangChange("en")}
              className={`min-h-11 rounded-md px-3 text-sm font-semibold ${
                lang === "en" ? "bg-sky text-navy" : "text-sky"
              }`}
            >
              English
            </button>
            <button
              type="button"
              aria-pressed={lang === "ja"}
              onClick={() => onLangChange("ja")}
              className={`min-h-11 rounded-md px-3 text-sm font-semibold ${
                lang === "ja" ? "bg-sky text-navy" : "text-sky"
              }`}
            >
              日本語
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p aria-live="polite" className="min-h-6 text-sm font-medium">
            {status.kind === "saving" && <span className="text-white">Saving…</span>}
            {status.kind === "saved" && (
              <span className="text-sky">✓ Saved — live on the website</span>
            )}
            {status.kind === "error" && (
              <span role="alert" className="text-blossom">
                {status.message}
              </span>
            )}
          </p>
          <a
            href="/#board"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-sky underline hover:text-white"
          >
            View on the website
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
