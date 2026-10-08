"use client";

import { useId, useRef, useState } from "react";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminCharacterCount } from "@/components/admin/admin-field";
import {
  contactLinkUrlForEditing,
  normalizeContactLinkUrl,
  requiredMessage,
  tooLongMessage,
} from "@/lib/volunteer-fields";
import { isImeComposing } from "./ime";
import { useInlineEditFocus } from "./use-inline-edit-focus";

const DESTINATION_HELP =
  "Leave this empty to send visitors to the Contact section of the home page. Or paste a web address or an email address.";

export function EditableLink({
  label,
  noun,
  value,
  fallback,
  url,
  maxLength,
  required = false,
  onSave,
  isOpen,
  onOpen,
  onClose,
  blocked,
  onDirtyChange,
}: {
  label: string;
  noun: string;
  value: string;
  fallback?: string;
  url: string | null;
  maxLength: number;
  required?: boolean;
  onSave: (words: string, url: string) => Promise<void>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  blocked?: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const baseId = useId();
  const wordsId = `${baseId}-words`;
  const urlId = `${baseId}-url`;
  const containerRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wordsRef = useRef<HTMLTextAreaElement>(null);
  const [words, setWords] = useState(value);
  const [destination, setDestination] = useState(contactLinkUrlForEditing(url));
  const [saving, setSaving] = useState(false);
  const [wordsError, setWordsError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useInlineEditFocus(isOpen, containerRef, buttonRef, wordsRef);

  function reset() {
    setWords(value);
    setDestination(contactLinkUrlForEditing(url));
    setWordsError(null);
    setUrlError(null);
    setSaveError(null);
    onDirtyChange?.(false);
  }

  function openField() {
    reset();
    onOpen();
  }

  function markDirty(nextWords: string, nextDestination: string) {
    onDirtyChange?.(nextWords !== value || nextDestination !== contactLinkUrlForEditing(url));
  }

  function validate(): boolean {
    const trimmed = words.trim();
    let valid = true;
    if (required && !trimmed) {
      setWordsError(requiredMessage(noun));
      valid = false;
    } else if (trimmed.length > maxLength) {
      setWordsError(tooLongMessage(noun, maxLength));
      valid = false;
    } else {
      setWordsError(null);
    }
    try {
      normalizeContactLinkUrl(destination);
      setUrlError(null);
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : "Please check the link address.");
      valid = false;
    }
    return valid;
  }

  async function handleSave() {
    if (saving || !validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(words, destination);
      onClose();
    } catch (e) {
      setSaveError(
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
    reset();
    onClose();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (isImeComposing(event)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    } else if (event.key === "Enter") {
      event.preventDefault();
      void handleSave();
    }
  }

  if (!isOpen) {
    const displayValue = value || fallback || "";
    const isFallback = !value && !!fallback;
    return (
      <span ref={containerRef} className="inline-flex flex-wrap items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={openField}
          aria-label={`Change ${label}: ${displayValue}`}
          className="inline-edit-target"
        >
          <span>{displayValue}</span>
          <span aria-hidden="true" className="inline-edit-chip pointer-coarse:opacity-100">
            ✎ Change link
          </span>
        </button>
        {isFallback && <AdminBadge tone="muted">Not translated yet</AdminBadge>}
        {blocked && (
          <span role="alert" className="block w-full text-sm font-medium text-magenta-deep">
            {blocked}
          </span>
        )}
      </span>
    );
  }

  return (
    <span ref={containerRef} className="block">
      <label htmlFor={wordsId} className="block font-display text-sm text-ink">
        {label}
      </label>
      {required === false && fallback !== undefined && !value && (
        <span className="mt-1 block text-sm text-stone">English: {fallback}</span>
      )}
      <textarea
        id={wordsId}
        ref={wordsRef}
        value={words}
        maxLength={maxLength}
        readOnly={saving}
        aria-busy={saving}
        onChange={(event) => {
          setWords(event.target.value);
          markDirty(event.target.value, destination);
        }}
        onKeyDown={handleKeyDown}
        rows={1}
        aria-describedby={wordsError ? `${wordsId}-error` : undefined}
        className="inline-edit-field field-sizing-content mt-2"
      />
      <AdminCharacterCount as="span" value={words} max={maxLength} />
      {wordsError && (
        <span id={`${wordsId}-error`} role="alert" className="mt-1 block text-sm font-medium text-magenta-deep">
          {wordsError}
        </span>
      )}

      <label htmlFor={urlId} className="mt-4 block font-display text-sm text-ink">
        Where the link goes
      </label>
      <span id={`${urlId}-help`} className="mt-1 block text-sm text-stone">
        {DESTINATION_HELP}
      </span>
      <input
        id={urlId}
        type="text"
        inputMode="url"
        autoComplete="off"
        value={destination}
        readOnly={saving}
        aria-busy={saving}
        onChange={(event) => {
          setDestination(event.target.value);
          markDirty(words, event.target.value);
        }}
        onKeyDown={handleKeyDown}
        aria-describedby={urlError ? `${urlId}-help ${urlId}-error` : `${urlId}-help`}
        className="inline-edit-field mt-2 text-base font-normal"
      />
      {urlError && (
        <span id={`${urlId}-error`} role="alert" className="mt-1 block text-sm font-medium text-magenta-deep">
          {urlError}
        </span>
      )}

      {saveError && (
        <span role="alert" className="mt-3 block text-sm font-medium text-magenta-deep">
          {saveError}
        </span>
      )}
      <span className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          aria-disabled={saving}
          className={`min-h-12 ${buttonClass("primary")}`}
        >
          {saving ? "Saving…" : "Save"}
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
