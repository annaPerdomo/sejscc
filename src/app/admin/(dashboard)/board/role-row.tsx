"use client";

import { useState, type ReactNode } from "react";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminTextField } from "@/components/admin/admin-field";
import { EditableText } from "@/components/admin/inline-edit/editable-text";
import { isImeComposing } from "@/components/admin/inline-edit/ime";
import type { RoleTextFieldName } from "@/components/volunteer-section";
import type { VolunteerRole } from "@/db/schema";
import type { Locale } from "@/lib/i18n";
import { ROLE_TEXT_FIELDS, englishRoleValue, japaneseRoleValue } from "@/lib/volunteer-fields";
import { focusByKey, type OpenTargetState } from "./open-target";

const FIELD_LABELS: Record<RoleTextFieldName, string> = {
  title: "Job title",
  description: "What it involves",
  commitment: "How much time it takes",
};

const FIELD_PLACEHOLDERS: Partial<Record<RoleTextFieldName, string>> = {
  commitment: "+ Add how much time it takes",
};

export function renderRoleField({
  role,
  field,
  lang,
  editState,
  onSaveText,
}: {
  role: VolunteerRole;
  field: RoleTextFieldName;
  lang: Locale;
  editState: OpenTargetState;
  onSaveText: (field: RoleTextFieldName, lang: Locale, value: string) => Promise<void>;
}): ReactNode {
  const spec = ROLE_TEXT_FIELDS[field];
  const englishValue = englishRoleValue(role, field);
  const value = lang === "en" ? englishValue : japaneseRoleValue(role, field);
  const noun = lang === "en" ? spec.label : `Japanese ${spec.label}`;

  return (
    <EditableText
      key={`${field}-${lang}`}
      label={`${FIELD_LABELS[field]} — ${lang === "en" ? "English" : "Japanese"}`}
      noun={noun}
      value={value}
      fallback={lang === "ja" ? englishValue : undefined}
      placeholder={lang === "en" ? FIELD_PLACEHOLDERS[field] : undefined}
      focusKey={field === "title" ? `role-title-${role.id}` : undefined}
      multiline={field === "description"}
      maxLength={spec.max}
      required={lang === "en" && spec.required}
      {...editState.fieldProps({ kind: "role", id: role.id, field })}
      onSave={(next) => onSaveText(field, lang, next)}
    />
  );
}

export function RoleControls({
  role,
  onOpenOptions,
}: {
  role: { id: string; title: string; visible: boolean };
  onOpenOptions: () => void;
}) {
  return (
    <>
      {!role.visible && (
        <span className="shrink-0">
          <AdminBadge tone="muted">Hidden from website</AdminBadge>
        </span>
      )}
      <button
        type="button"
        onClick={onOpenOptions}
        data-focus-key={`role-options-${role.id}`}
        className={`min-h-11 shrink-0 ${buttonClass("secondary")}`}
      >
        Options<span className="sr-only"> for {role.title}</span>
      </button>
    </>
  );
}

export function AddRoleRow({
  isOpen,
  onOpen,
  onClose,
  blocked,
  onDirtyChange,
  onAdd,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  blocked?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onAdd: (title: string, description: string) => Promise<void>;
}) {
  const [step, setStep] = useState<"title" | "description">("title");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openForm() {
    setStep("title");
    setTitle("");
    setDescription("");
    setError(null);
    onOpen();
  }

  function updateTitle(next: string) {
    setTitle(next);
    onDirtyChange?.(next.trim().length > 0 || description.trim().length > 0);
  }

  function updateDescription(next: string) {
    setDescription(next);
    onDirtyChange?.(title.trim().length > 0 || next.trim().length > 0);
  }

  function cancel() {
    if (saving) return;
    setStep("title");
    setTitle("");
    setDescription("");
    onDirtyChange?.(false);
    setError(null);
    onClose();
    setTimeout(() => focusByKey("add-role-button"), 0);
  }

  function back() {
    if (saving) return;
    setError(null);
    setStep("title");
  }

  function next() {
    if (!title.trim()) {
      setError("Please fill in the English title.");
      return;
    }
    setError(null);
    setStep("description");
  }

  async function save() {
    if (saving) return;
    if (!description.trim()) {
      setError("Please fill in the English description.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd(title, description);
      setStep("title");
      setTitle("");
      setDescription("");
      onDirtyChange?.(false);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong adding this way to help. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <li>
        <button
          type="button"
          onClick={openForm}
          data-focus-key="add-role-button"
          className="flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-dashed border-line text-sm font-semibold text-indigo-deep hover:bg-indigo/5"
        >
          + Add a way to help
        </button>
        {blocked && (
          <p role="alert" className="mt-1 text-sm font-medium text-magenta-deep">
            {blocked}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-line bg-white p-4">
      {step === "title" ? (
        <>
          <label className="block font-display text-sm text-ink" htmlFor="new-role-title">
            What&apos;s the job?
          </label>
          <textarea
            id="new-role-title"
            value={title}
            maxLength={ROLE_TEXT_FIELDS.title.max}
            readOnly={saving}
            onChange={(event) => updateTitle(event.target.value)}
            onKeyDown={(event) => {
              if (isImeComposing(event)) return;
              if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
              if (event.key === "Enter") {
                event.preventDefault();
                next();
              }
            }}
            rows={1}
            className="inline-edit-field field-sizing-content mt-2"
          />
          {error && (
            <p role="alert" className="mt-1 text-sm font-medium text-magenta-deep">
              {error}
            </p>
          )}
          <span className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={next}
              className={`min-h-12 ${buttonClass("primary")}`}
            >
              Next
            </button>
            <button
              type="button"
              onClick={cancel}
              className={`min-h-12 ${buttonClass("secondary")}`}
            >
              Cancel
            </button>
          </span>
        </>
      ) : (
        <>
          <label className="block font-display text-sm text-ink" htmlFor="new-role-description">
            What does it involve?
          </label>
          <textarea
            id="new-role-description"
            value={description}
            maxLength={ROLE_TEXT_FIELDS.description.max}
            readOnly={saving}
            onChange={(event) => updateDescription(event.target.value)}
            onKeyDown={(event) => {
              if (isImeComposing(event)) return;
              if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
            rows={4}
            className="inline-edit-field field-sizing-content mt-2"
          />
          {error && (
            <p role="alert" className="mt-1 text-sm font-medium text-magenta-deep">
              {error}
            </p>
          )}
          <span className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void save()}
              aria-disabled={saving}
              className={`min-h-12 ${buttonClass("primary")}`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={back}
              aria-disabled={saving}
              className={`min-h-12 ${buttonClass("secondary")}`}
            >
              Back
            </button>
            <button
              type="button"
              onClick={cancel}
              aria-disabled={saving}
              className={`min-h-12 ${buttonClass("secondary")}`}
            >
              Cancel
            </button>
          </span>
        </>
      )}
    </li>
  );
}

export function RoleSignupField({
  role,
  onSaved,
}: {
  role: VolunteerRole;
  onSaved: (signupUrl: string) => Promise<void>;
}) {
  const [value, setValue] = useState(role.signupUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSaved(value);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving this link. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <AdminTextField
        label="Sign-up link"
        type="url"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="https://forms.gle/..."
        disabled={saving}
        size="lg"
        aria-describedby="role-signup-url-hint"
      />
      <p id="role-signup-url-hint" className="text-sm text-stone">
        Paste a sign-up form link, such as a Google Form. Leave empty and
        visitors will be pointed to the center&apos;s contact details instead.
      </p>
      {error && <AdminAlert>{error}</AdminAlert>}
      <button
        type="button"
        onClick={() => void save()}
        aria-disabled={saving}
        className={`min-h-12 ${buttonClass("primary")}`}
      >
        {saving ? "Saving…" : "Save link"}
      </button>
    </div>
  );
}
