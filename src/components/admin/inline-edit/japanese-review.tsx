"use client";

import { useEffect, useId, useRef, useState } from "react";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminCharacterCount } from "@/components/admin/admin-field";
import { japaneseNote } from "@/lib/admin-messages";
import type { JapaneseUpdate } from "@/lib/japanese-drafts";
import { asOneParagraph, tooLongMessage } from "@/lib/volunteer-fields";
import { isImeComposing } from "./ime";

export type SavedWords = {
  english: string;
  japanese: string | null;
  update: JapaneseUpdate | null;
};

const EMPTY_JAPANESE_MESSAGE = "Please type the Japanese, or press Cancel to leave it as it is.";
const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";

function japaneseHeading(saved: SavedWords, kept: boolean, fixed: boolean): string {
  if (fixed) return "Japanese (your own words)";
  if (kept) return "Japanese (left as it was)";
  if (saved.update === "rewritten") return "Japanese (rewritten to match)";
  return "Japanese";
}

export function JapaneseReview({
  saved,
  kept,
  max,
  onSaveJapanese,
  onDirtyChange,
  onDone,
}: {
  saved: SavedWords;
  kept: boolean;
  max: number;
  onSaveJapanese: (next: string) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onDone: () => void;
}) {
  const textareaId = useId();
  const summaryRef = useRef<HTMLSpanElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [japanese, setJapanese] = useState(saved.japanese ?? "");
  const [fixed, setFixed] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fixing) textareaRef.current?.focus();
    else summaryRef.current?.focus();
  }, [fixing]);

  const notWritten = !fixed && (saved.update === "limit" || saved.update === "unavailable");

  function startFixing() {
    setDraft(notWritten ? "" : japanese);
    setError(null);
    setFixing(true);
  }

  function stopFixing() {
    if (saving) return;
    setFixing(false);
    onDirtyChange?.(false);
  }

  function updateDraft(typed: string) {
    const next = asOneParagraph(typed);
    setDraft(next);
    onDirtyChange?.(next !== japanese);
  }

  async function saveFix() {
    if (saving) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setError(EMPTY_JAPANESE_MESSAGE);
      return;
    }
    if (trimmed.length > max) {
      setError(tooLongMessage("Japanese", max));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSaveJapanese(trimmed);
      setJapanese(trimmed);
      setFixed(true);
      setFixing(false);
      onDirtyChange?.(false);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (isImeComposing(event)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      stopFixing();
      return;
    }
    if (event.key === "Enter") event.preventDefault();
  }

  if (fixing) {
    return (
      <span data-inline-edit-open className="flex flex-col gap-4 font-sans text-base font-normal tracking-normal text-ink">
        <span className="flex flex-col gap-2">
          <label htmlFor={textareaId} className="font-display text-base font-semibold text-ink">
            Japanese
          </label>
          <span className="text-ink-soft">English: {saved.english}</span>
          <textarea
            id={textareaId}
            ref={textareaRef}
            lang="ja"
            value={draft}
            maxLength={max}
            readOnly={saving}
            aria-busy={saving}
            onChange={(event) => updateDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            aria-describedby={error ? `${textareaId}-error` : undefined}
            className="inline-edit-field field-sizing-content text-lg"
          />
          <AdminCharacterCount as="span" value={draft} max={max} className="ml-auto tabular-nums text-ink-soft" />
          {error && (
            <span id={`${textareaId}-error`} role="alert" className="font-medium text-magenta-deep">
              {error}
            </span>
          )}
        </span>
        <span className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void saveFix()}
            aria-disabled={saving}
            className={`min-h-12 ${buttonClass("primary")}`}
          >
            {saving ? "Saving…" : "Save the Japanese"}
          </button>
          <button
            type="button"
            onClick={stopFixing}
            aria-disabled={saving}
            className={`min-h-12 ${buttonClass("secondary")}`}
          >
            Cancel
          </button>
        </span>
      </span>
    );
  }

  return (
    <span className="block font-sans text-base font-normal tracking-normal text-ink">
      <span
        ref={summaryRef}
        tabIndex={-1}
        role="group"
        aria-label="Saved. Check the English and the Japanese."
        className="block outline-none"
      >
        <span className="block font-display text-xl font-semibold text-indigo-deep">
          ✓ Saved. It&rsquo;s on the website now.
        </span>
        <span className="mt-4 block font-display text-base font-semibold text-ink-soft">English</span>
        <span className="mt-1 block rounded-xl bg-mist px-4 py-3 text-lg leading-relaxed">{saved.english}</span>
        <span className="mt-4 block font-display text-base font-semibold text-ink-soft">
          {japaneseHeading(saved, kept, fixed)}
        </span>
        {notWritten && saved.update ? (
          <span className="mt-1 block rounded-xl border border-gold bg-butter px-4 py-3 text-lg leading-relaxed">
            {japaneseNote(saved.update)}
          </span>
        ) : japanese ? (
          <span lang="ja" className="mt-1 block rounded-xl bg-azure px-4 py-3 text-lg leading-relaxed">
            {japanese}
          </span>
        ) : (
          <span className="mt-1 block rounded-xl bg-mist px-4 py-3 text-lg leading-relaxed">
            No Japanese has been written here, so the Japanese page shows the English.
          </span>
        )}
      </span>
      <span className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onDone} className={`min-h-12 ${buttonClass("primary")}`}>
          Done
        </button>
        <button type="button" onClick={startFixing} className={`min-h-12 ${buttonClass("secondary")}`}>
          {notWritten || !japanese ? "Type the Japanese myself" : "Fix the Japanese"}
        </button>
      </span>
    </span>
  );
}
