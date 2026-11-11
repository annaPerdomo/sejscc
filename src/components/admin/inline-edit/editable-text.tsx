"use client";

import { useId, useRef, useState } from "react";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminCharacterCount } from "@/components/admin/admin-field";
import { asOneParagraph, requiredMessage, tooLongMessage } from "@/lib/volunteer-fields";
import { isImeComposing } from "./ime";
import { JapaneseReview, type SavedWords } from "./japanese-review";
import { useInlineEditFocus } from "./use-inline-edit-focus";

export type JapaneseTwin = {
  value: string;
  max: number;
  onSave: (next: string) => Promise<void>;
};

export function EditableText({
  label,
  noun,
  value,
  fallback,
  english,
  japanese,
  note,
  placeholder,
  focusKey,
  multiline = false,
  maxLength,
  required = false,
  emptyMessage,
  onSave,
  isOpen,
  onOpen,
  onClose,
  blocked,
  onDirtyChange,
  onReviewChange,
}: {
  label: string;
  /** Must match the server's wording so error messages are identical. */
  noun: string;
  value: string;
  fallback?: string;
  english?: string;
  japanese?: JapaneseTwin;
  note?: string;
  placeholder?: string;
  focusKey?: string;
  multiline?: boolean;
  maxLength: number;
  required?: boolean;
  emptyMessage?: string;
  onSave: (next: string, keepJapanese: boolean) => Promise<SavedWords | void>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  blocked?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onReviewChange?: (reviewing: boolean) => void;
}) {
  const textareaId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateJapanese, setUpdateJapanese] = useState(true);
  const [review, setReview] = useState<{ saved: SavedWords; kept: boolean } | null>(null);

  function openField() {
    setDraft(value);
    setError(null);
    setUpdateJapanese(true);
    setReview(null);
    onReviewChange?.(false);
    onDirtyChange?.(false);
    onOpen();
  }

  function updateDraft(typed: string) {
    const next = asOneParagraph(typed);
    setDraft(next);
    onDirtyChange?.(next !== value);
  }

  useInlineEditFocus(isOpen, containerRef, buttonRef, textareaRef);

  function validate(next: string): string | null {
    const trimmed = next.trim();
    if (required && !trimmed) return emptyMessage ?? requiredMessage(noun);
    if (trimmed.length > maxLength) return tooLongMessage(noun, maxLength);
    return null;
  }

  async function handleSave() {
    if (saving) return;
    const validationError = validate(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const keepJapanese = japanese !== undefined && !updateJapanese;
      const saved = await onSave(draft, keepJapanese);
      if (japanese && saved) {
        setReview({ saved, kept: keepJapanese });
        onReviewChange?.(true);
        onDirtyChange?.(false);
      } else {
        onClose();
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving this. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;
    setDraft(value);
    setError(null);
    onClose();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (isImeComposing(event)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (!multiline) void handleSave();
    }
  }

  if (!isOpen) {
    const isPlaceholder = !value && !fallback && !!placeholder;
    const displayValue = value || fallback || placeholder || "";
    const isFallback = !value && !!fallback;
    return (
      <span ref={containerRef} className="inline">
        <button
          ref={buttonRef}
          type="button"
          onClick={openField}
          aria-label={`Change ${label}: ${displayValue}`}
          data-focus-key={focusKey}
          className="inline-edit-target"
        >
          <span className={isPlaceholder ? "text-ink-soft" : undefined}>{displayValue}</span>
          <span aria-hidden="true" className="inline-edit-chip">
            ✎ Change
          </span>
        </button>
        {isFallback && (
          <span className="ml-2 align-middle">
            <AdminBadge tone="muted">Not translated yet</AdminBadge>
          </span>
        )}
      </span>
    );
  }

  if (review && japanese) {
    return (
      <span ref={containerRef} className="block">
        <JapaneseReview
          saved={review.saved}
          kept={review.kept}
          max={japanese.max}
          onSaveJapanese={japanese.onSave}
          onDirtyChange={onDirtyChange}
          onDone={() => {
            setReview(null);
            onReviewChange?.(false);
            onClose();
          }}
        />
      </span>
    );
  }

  const willRewrite = japanese !== undefined && updateJapanese;
  const englishReference = english || (value ? undefined : fallback);
  return (
    <span ref={containerRef} data-inline-edit-open className="block">
      <label htmlFor={textareaId} className="block font-display text-base text-ink">
        {label}
      </label>
      {englishReference && (
        <span className="mt-1 block text-base text-ink-soft">English: {englishReference}</span>
      )}
      <textarea
        id={textareaId}
        ref={textareaRef}
        value={draft}
        maxLength={maxLength}
        readOnly={saving}
        aria-busy={saving}
        onChange={(event) => updateDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={multiline ? 4 : 1}
        aria-describedby={
          [multiline && `${textareaId}-hint`, note && `${textareaId}-note`, error && `${textareaId}-error`]
            .filter(Boolean)
            .join(" ") ||
          undefined
        }
        className="inline-edit-field field-sizing-content mt-2"
      />
      {multiline && (
        <span id={`${textareaId}-hint`} className="mt-1 block font-sans text-base font-normal tracking-normal text-ink-soft">
          This box is one paragraph — the website doesn&rsquo;t keep line breaks.
        </span>
      )}
      {note && (
        <span id={`${textareaId}-note`} className="mt-2 block rounded-lg bg-azure px-3 py-2 font-sans text-base font-normal tracking-normal text-ink">
          {note}
        </span>
      )}
      <AdminCharacterCount as="span" value={draft} max={maxLength} />
      {japanese && (
        <span className="mt-3 block rounded-lg bg-azure px-3 py-2 font-sans text-base font-normal tracking-normal text-ink">
          <label className="flex min-h-12 cursor-pointer items-center gap-3 text-lg font-semibold">
            <input
              type="checkbox"
              checked={updateJapanese}
              disabled={saving}
              onChange={(event) => setUpdateJapanese(event.target.checked)}
              aria-describedby={`${textareaId}-japanese`}
              className="size-7 shrink-0 accent-indigo-deep"
            />
            Update the Japanese page too
          </label>
          <span id={`${textareaId}-japanese`} className="block pb-1">
            {updateJapanese ? (
              "The Japanese is rewritten to match your English. It takes a few seconds, and you'll see it before you finish."
            ) : japanese.value ? (
              <>
                The Japanese page will keep saying: <span lang="ja">{japanese.value}</span>
              </>
            ) : (
              "The Japanese page will stay as it is."
            )}
          </span>
        </span>
      )}
      {error && (
        <span id={`${textareaId}-error`} role="alert" className="mt-1 block text-base font-medium text-magenta-deep">
          {error}
        </span>
      )}
      {blocked && (
        <span role="alert" className="mt-3 block rounded-lg bg-cream px-3 py-2 font-sans text-base font-medium tracking-normal text-ink">
          {blocked}
        </span>
      )}
      <span className="mt-3 flex flex-wrap gap-3 font-sans text-base tracking-normal">
        <button
          type="button"
          onClick={() => void handleSave()}
          aria-disabled={saving}
          className={`min-h-12 ${buttonClass("primary")}`}
        >
          {saving ? (willRewrite ? "Saving and writing the Japanese…" : "Saving…") : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          aria-disabled={saving}
          className={`min-h-12 ${buttonClass("secondary")}`}
        >
          Cancel
        </button>
      </span>
    </span>
  );
}
