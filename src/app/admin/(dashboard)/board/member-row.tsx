"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { upload } from "@vercel/blob/client";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminRequired, AdminTextField } from "@/components/admin/admin-field";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import type { BoardMember } from "@/db/schema";
import type { Locale } from "@/lib/i18n";
import {
  MEMBER_TEXT_FIELDS,
  englishMemberValue,
  japaneseMemberValue,
} from "@/lib/volunteer-fields";
import { isImeComposing } from "@/components/admin/inline-edit/ime";
import { focusByKey } from "@/components/admin/inline-edit/use-open-target";

type PhotoDraft =
  | { kind: "unchanged" }
  | { kind: "removed" }
  | { kind: "file"; file: File; previewUrl: string; uploadedUrl?: string };

export function MemberButton({
  member,
  content,
  onOpen,
}: {
  member: { id: string; name: string; role: string | null; visible: boolean };
  content: ReactNode;
  onOpen: () => void;
}) {
  const accessibleName = `Change ${member.name}${member.role ? `, ${member.role}` : ""}${
    member.visible ? "" : " (hidden from website)"
  }`;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={accessibleName}
      data-focus-key={`member-button-${member.id}`}
      className="inline-edit-target relative -m-1 block min-h-11 min-w-0 flex-1 rounded-lg p-1 text-left"
    >
      <span className="flex flex-col items-start">
        {content}
        {!member.visible && (
          <span className="mt-1">
            <AdminBadge tone="muted">Hidden</AdminBadge>
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className="inline-edit-chip pointer-coarse:opacity-100 absolute -top-3 right-0 ml-0 pointer-coarse:static pointer-coarse:mt-1"
      >
        ✎ Change
      </span>
    </button>
  );
}

export function MemberFieldsForm({
  member,
  lang,
  onSave,
  onDirtyChange,
  onSavingChange,
}: {
  member: BoardMember;
  lang: Locale;
  onSave: (name: string, role: string) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}) {
  const englishName = englishMemberValue(member, "name");
  const englishRole = englishMemberValue(member, "role");
  const initialName = lang === "en" ? englishName : japaneseMemberValue(member, "name");
  const initialRole = lang === "en" ? englishRole : japaneseMemberValue(member, "role");

  const [name, setName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameGuideId = useId();
  const roleGuideId = useId();

  function reportDirty(nextName: string, nextRole: string) {
    onDirtyChange?.(nextName !== initialName || nextRole !== initialRole);
  }

  function updateName(next: string) {
    setName(next);
    reportDirty(next, role);
  }

  function updateRole(next: string) {
    setRole(next);
    reportDirty(name, next);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    onSavingChange?.(true);
    setError(null);
    try {
      await onSave(name, role);
      onDirtyChange?.(false);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving this. Please try again."
      );
    } finally {
      setSaving(false);
      onSavingChange?.(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && isImeComposing(event)) event.preventDefault();
      }}
    >
      <div>
        <AdminTextField
          label={lang === "en" ? <>Name <AdminRequired /></> : "Japanese name"}
          value={name}
          maxLength={MEMBER_TEXT_FIELDS.name.max}
          disabled={saving}
          aria-describedby={lang === "ja" ? nameGuideId : undefined}
          onChange={(event) => updateName(event.target.value)}
        />
        {lang === "ja" && (
          <p id={nameGuideId} className="mt-1 text-sm text-stone">
            English: {englishName}
          </p>
        )}
      </div>
      <div>
        <AdminTextField
          label={
            lang === "en" ? "Title, such as President — optional" : "Japanese title — optional"
          }
          value={role}
          maxLength={MEMBER_TEXT_FIELDS.role.max}
          disabled={saving}
          aria-describedby={lang === "ja" && englishRole ? roleGuideId : undefined}
          onChange={(event) => updateRole(event.target.value)}
        />
        {lang === "ja" && englishRole && (
          <p id={roleGuideId} className="mt-1 text-sm text-stone">
            English: {englishRole}
          </p>
        )}
      </div>
      {error && <AdminAlert>{error}</AdminAlert>}
      <button
        type="submit"
        aria-disabled={saving}
        className={`min-h-12 ${buttonClass("primary")}`}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
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
    <div className="space-y-3">
      <AdminImagePicker
        label="Photo"
        hint="Optional. Shows as a small circle next to the name."
        value={photoValue}
        onFileChosen={onFileChosen}
        onRemove={photoValue ? onRemove : undefined}
        previewShape="circle"
        layout="compact"
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
