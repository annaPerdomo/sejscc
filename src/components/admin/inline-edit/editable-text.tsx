"use client";

import { useId, useRef, useState } from "react";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminCharacterCount } from "@/components/admin/admin-field";
import { requiredMessage, tooLongMessage } from "@/lib/volunteer-fields";
import { isImeComposing } from "./ime";
import { useInlineEditFocus } from "./use-inline-edit-focus";

export function EditableText({
  label,
  noun,
  value,
  fallback,
  placeholder,
  focusKey,
  multiline = false,
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
  /** Must match the server's wording so error messages are identical. */
  noun: string;
  value: string;
  fallback?: string;
  placeholder?: string;
  focusKey?: string;
  multiline?: boolean;
  maxLength: number;
  required?: boolean;
  onSave: (next: string) => Promise<void>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  blocked?: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const textareaId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openField() {
    setDraft(value);
    setError(null);
    onDirtyChange?.(false);
    onOpen();
  }

  function updateDraft(next: string) {
    setDraft(next);
    onDirtyChange?.(next !== value);
  }

  useInlineEditFocus(isOpen, containerRef, buttonRef, textareaRef);

  function validate(next: string): string | null {
    const trimmed = next.trim();
    if (required && !trimmed) return requiredMessage(noun);
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (isImeComposing(event)) return;
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
      return;
    }
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      void handleSave();
    }
  }

  if (!isOpen) {
    const isPlaceholder = !value && !fallback && !!placeholder;
    const displayValue = value || fallback || placeholder || "";
    const isFallback = !value && !!fallback;
    return (
      <span ref={containerRef} className="inline-flex flex-wrap items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={openField}
          aria-label={`Change ${label}: ${displayValue}`}
          data-focus-key={focusKey}
          className="inline-edit-target"
        >
          <span className={isPlaceholder ? "text-ink-soft" : undefined}>{displayValue}</span>
          <span aria-hidden="true" className="inline-edit-chip pointer-coarse:opacity-100">
            ✎ Change
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
      <label htmlFor={textareaId} className="block font-display text-sm text-ink">
        {label}
      </label>
      {required === false && fallback !== undefined && !value && (
        <span className="mt-1 block text-sm text-stone">English: {fallback}</span>
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
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className="inline-edit-field field-sizing-content mt-2"
      />
      <AdminCharacterCount as="span" value={draft} max={maxLength} />
      {error && (
        <span id={`${textareaId}-error`} role="alert" className="mt-1 block text-sm font-medium text-magenta-deep">
          {error}
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
