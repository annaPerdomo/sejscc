"use client";

import { useId, useRef, useState } from "react";
import { buttonClass } from "@/components/admin/admin-button";
import { normalizeSiteLinkUrl, SITE_LINK_URL_MESSAGE } from "@/lib/site-links";
import { isImeComposing } from "./ime";
import { useInlineEditFocus } from "./use-inline-edit-focus";

export function EditableUrl({
  label,
  help,
  value,
  onSave,
  isOpen,
  onOpen,
  onClose,
  blocked,
  onDirtyChange,
}: {
  label: string;
  help: string;
  value: string;
  onSave: (url: string) => Promise<void>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  blocked?: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const inputId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useInlineEditFocus(isOpen, containerRef, buttonRef, inputRef);

  function openField() {
    setDraft(value);
    setError(null);
    onDirtyChange?.(false);
    onOpen();
  }

  function validate(): boolean {
    try {
      if (!normalizeSiteLinkUrl(draft)) {
        setError(SITE_LINK_URL_MESSAGE);
        return false;
      }
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : SITE_LINK_URL_MESSAGE);
      return false;
    }
  }

  async function handleSave() {
    if (saving || !validate()) return;
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
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
    return (
      <span ref={containerRef} className="block">
        <span className="block font-display text-base text-ink">{label}</span>
        <span className="mt-1 block text-base text-ink-soft">{help}</span>
        <button
          ref={buttonRef}
          type="button"
          onClick={openField}
          aria-label={`Change ${label}: ${value}`}
          className="inline-edit-target mt-2 text-base break-all text-indigo-deep"
        >
          <span>{value}</span>
          <span aria-hidden="true" className="inline-edit-chip">
            ✎ Change link
          </span>
        </button>
      </span>
    );
  }

  return (
    <span ref={containerRef} data-inline-edit-open className="block">
      <label htmlFor={inputId} className="block font-display text-base text-ink">
        {label}
      </label>
      <span id={`${inputId}-help`} className="mt-1 block text-base text-ink-soft">
        {help} Paste the form&rsquo;s full web address.
      </span>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        inputMode="url"
        autoComplete="off"
        value={draft}
        readOnly={saving}
        aria-busy={saving}
        onChange={(event) => {
          setDraft(event.target.value);
          onDirtyChange?.(event.target.value !== value);
        }}
        onKeyDown={handleKeyDown}
        aria-describedby={error ? `${inputId}-help ${inputId}-error` : `${inputId}-help`}
        className="inline-edit-field mt-2 text-base font-normal"
      />
      {error && (
        <span id={`${inputId}-error`} role="alert" className="mt-1 block text-base font-medium text-magenta-deep">
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
