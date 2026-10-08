"use client";

import { useEffect, useState, type ReactNode } from "react";
import { upload } from "@vercel/blob/client";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import { EditableText } from "@/components/admin/inline-edit/editable-text";
import { isImeComposing } from "@/components/admin/inline-edit/ime";
import type { MemberTextFieldName } from "@/components/volunteer-section";
import type { BoardMember } from "@/db/schema";
import type { Locale } from "@/lib/i18n";
import {
  MEMBER_TEXT_FIELDS,
  englishMemberValue,
  japaneseMemberValue,
} from "@/lib/volunteer-fields";
import { focusByKey, type OpenTargetState } from "./open-target";

type PhotoDraft =
  | { kind: "unchanged" }
  | { kind: "removed" }
  | { kind: "file"; file: File; previewUrl: string; uploadedUrl?: string };

const FIELD_LABELS: Record<MemberTextFieldName, string> = {
  name: "Name",
  role: "Title, such as President",
};

const FIELD_PLACEHOLDERS: Partial<Record<MemberTextFieldName, string>> = {
  role: "+ Add a title",
};

export function renderMemberField({
  member,
  field,
  lang,
  editState,
  onSaveText,
}: {
  member: BoardMember;
  field: MemberTextFieldName;
  lang: Locale;
  editState: OpenTargetState;
  onSaveText: (field: MemberTextFieldName, lang: Locale, value: string) => Promise<void>;
}): ReactNode {
  const spec = MEMBER_TEXT_FIELDS[field];
  const englishValue = englishMemberValue(member, field);
  const value = lang === "en" ? englishValue : japaneseMemberValue(member, field);
  const noun = lang === "en" ? spec.label : `Japanese ${spec.label}`;

  return (
    <EditableText
      key={`${field}-${lang}`}
      label={`${FIELD_LABELS[field]} — ${lang === "en" ? "English" : "Japanese"}`}
      noun={noun}
      value={value}
      fallback={lang === "ja" ? englishValue : undefined}
      placeholder={lang === "en" ? FIELD_PLACEHOLDERS[field] : undefined}
      focusKey={field === "name" ? `member-name-${member.id}` : undefined}
      maxLength={spec.max}
      required={lang === "en" && spec.required}
      {...editState.fieldProps({ kind: "member", id: member.id, field })}
      onSave={(next) => onSaveText(field, lang, next)}
    />
  );
}

export function MemberControls({
  member,
  onOpenOptions,
}: {
  member: { id: string; name: string; visible: boolean };
  onOpenOptions: () => void;
}) {
  return (
    <>
      {!member.visible && (
        <span className="shrink-0">
          <AdminBadge tone="muted">Hidden from website</AdminBadge>
        </span>
      )}
      <button
        type="button"
        onClick={onOpenOptions}
        data-focus-key={`member-options-${member.id}`}
        className={`min-h-11 shrink-0 ${buttonClass("secondary")}`}
      >
        Options<span className="sr-only"> for {member.name}</span>
      </button>
    </>
  );
}

export function AddMemberRow({
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
  onAdd: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openForm() {
    setName("");
    setError(null);
    onOpen();
  }

  function updateName(next: string) {
    setName(next);
    onDirtyChange?.(next.trim().length > 0);
  }

  function cancel() {
    if (saving) return;
    setName("");
    onDirtyChange?.(false);
    setError(null);
    onClose();
    setTimeout(() => focusByKey("add-member-button"), 0);
  }

  async function save() {
    if (saving) return;
    if (!name.trim()) {
      setError("Please fill in the English name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd(name);
      setName("");
      onDirtyChange?.(false);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong adding this board member. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <li className="col-span-2">
        <button
          type="button"
          onClick={openForm}
          data-focus-key="add-member-button"
          className="flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-dashed border-line text-sm font-semibold text-indigo-deep hover:bg-indigo/5"
        >
          + Add a name
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
    <li className="col-span-2 rounded-xl border border-line bg-white p-4">
      <label className="block font-display text-sm text-ink" htmlFor="new-board-member-name">
        New board member&apos;s name
      </label>
      <textarea
        id="new-board-member-name"
        value={name}
        maxLength={MEMBER_TEXT_FIELDS.name.max}
        readOnly={saving}
        onChange={(event) => updateName(event.target.value)}
        onKeyDown={(event) => {
          if (isImeComposing(event)) return;
          if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
          if (event.key === "Enter") {
            event.preventDefault();
            void save();
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
          onClick={() => void save()}
          aria-disabled={saving}
          className={`min-h-12 ${buttonClass("primary")}`}
        >
          {saving ? "Saving…" : "Save"}
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
    </li>
  );
}

export function MemberPhotoField({
  member,
  onSaved,
}: {
  member: BoardMember;
  onSaved: (photoUrl: string | null) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PhotoDraft>({ kind: "unchanged" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = draft.kind === "file" ? draft.previewUrl : null;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onFileChosen(file: File | null) {
    if (!file) return;
    setDraft({ kind: "file", file, previewUrl: URL.createObjectURL(file) });
    setError(null);
  }

  function onRemove() {
    setDraft(member.photoUrl ? { kind: "removed" } : { kind: "unchanged" });
    setError(null);
  }

  async function save() {
    if (draft.kind === "unchanged" || saving) return;
    setSaving(true);
    setError(null);
    try {
      let photoUrl: string | null;
      if (draft.kind === "removed") {
        photoUrl = null;
      } else if (draft.uploadedUrl) {
        photoUrl = draft.uploadedUrl;
      } else {
        const result = await upload(`board/members/${draft.file.name}`, draft.file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        photoUrl = result.url;
        const uploadedUrl = photoUrl;
        setDraft((current) => (current.kind === "file" ? { ...current, uploadedUrl } : current));
      }
      await onSaved(photoUrl);
      setDraft({ kind: "unchanged" });
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving this photo. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  const photoValue =
    draft.kind === "file" ? draft.previewUrl : draft.kind === "removed" ? null : member.photoUrl;

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <AdminImagePicker
        label={member.photoUrl ? "Change photo" : "Add a photo"}
        value={photoValue}
        onFileChosen={onFileChosen}
        onRemove={photoValue ? onRemove : undefined}
        previewShape="circle"
        disabled={saving}
      />
      {error && <AdminAlert>{error}</AdminAlert>}
      {draft.kind !== "unchanged" && (
        <button
          type="button"
          onClick={() => void save()}
          aria-disabled={saving}
          className={`min-h-12 ${buttonClass("primary")}`}
        >
          {saving ? "Saving…" : "Save photo"}
        </button>
      )}
    </div>
  );
}
