"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { AdminAlert } from "@/components/admin/admin-alert";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminTextArea } from "@/components/admin/admin-field";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import type { EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import { EditDialog } from "@/components/admin/inline-edit/edit-dialog";
import type { UndoState } from "@/components/admin/inline-edit/use-undo";
import type { VolunteerSectionRow } from "@/db/schema";
import { boardPhoto } from "@/lib/photos";
import { updateSectionPhoto } from "./actions";

type PhotoDraft =
  | { kind: "unchanged" }
  | { kind: "removed" }
  | { kind: "file"; file: File; previewUrl: string; uploadedUrl?: string };

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";

export function useSectionPhotoDialog({
  section,
  setSection,
  setStatus,
  undo,
}: {
  section: VolunteerSectionRow;
  setSection: (section: VolunteerSectionRow) => void;
  setStatus: (status: EditBarStatus) => void;
  undo: UndoState;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PhotoDraft>({ kind: "unchanged" });
  const [altDraft, setAltDraft] = useState(section.photoAlt);
  const [altJaDraft, setAltJaDraft] = useState(section.photoAltJa ?? "");
  const [altError, setAltError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = draft.kind === "file" ? draft.previewUrl : null;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function openDialog() {
    setDraft({ kind: "unchanged" });
    setAltDraft(section.photoAlt);
    setAltJaDraft(section.photoAltJa ?? "");
    setAltError(null);
    setError(null);
    setOpen(true);
  }

  function onFileChosen(file: File | null) {
    if (!file) return;
    setDraft({ kind: "file", file, previewUrl: URL.createObjectURL(file) });
  }

  function useOriginalPhoto() {
    setDraft(section.photoUrl !== null ? { kind: "removed" } : { kind: "unchanged" });
  }

  async function save() {
    if (saving) return;
    if (!altDraft.trim()) {
      setAltError("Please fill in the English photo description.");
      return;
    }
    setAltError(null);
    setError(null);
    setSaving(true);

    const previousSection = section;
    try {
      let photoUrl: string | null;
      if (draft.kind === "file") {
        if (draft.uploadedUrl) {
          photoUrl = draft.uploadedUrl;
        } else {
          const result = await upload(`board/${draft.file.name}`, draft.file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          photoUrl = result.url;
          const uploadedUrl = photoUrl;
          setDraft((current) => (current.kind === "file" ? { ...current, uploadedUrl } : current));
        }
      } else if (draft.kind === "removed") {
        photoUrl = null;
      } else {
        photoUrl = section.photoUrl;
      }

      const photoAlt = altDraft.trim();
      const photoAltJa = altJaDraft.trim();

      setSection({ ...section, photoUrl, photoAlt, photoAltJa: photoAltJa || null });
      setStatus({ kind: "saving" });

      await updateSectionPhoto({ photoUrl, photoAlt, photoAltJa });

      undo.clear();
      setStatus({ kind: "saved" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      setSection(previousSection);
      const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
      setError(message);
      setStatus({ kind: "error", message });
    } finally {
      setSaving(false);
    }
  }

  function renderPhotoEdit(image: ReactNode): ReactNode {
    return (
      <>
        {image}
        <button
          type="button"
          onClick={openDialog}
          className={`absolute right-4 bottom-4 inline-flex min-h-12 items-center gap-2 rounded-lg px-5 text-sm font-semibold tracking-[0.04em] uppercase ${buttonClass(
            "primary"
          )}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
            />
            <circle cx="12" cy="13" r="3.25" />
          </svg>
          Change photo
        </button>
      </>
    );
  }

  const photoValue =
    draft.kind === "file" ? draft.previewUrl : draft.kind === "removed" ? null : section.photoUrl;

  const dialog = (
    <EditDialog title="Change the photo" open={open} busy={saving} onClose={() => setOpen(false)}>
      <div className="space-y-5">
        <AdminImagePicker
          label="Photo"
          hint="A clear photo of the board or volunteers."
          value={photoValue}
          fallbackSrc={boardPhoto.src}
          onFileChosen={onFileChosen}
          disabled={saving}
        />
        {(draft.kind === "file" || (draft.kind === "unchanged" && section.photoUrl !== null)) && (
          <button
            type="button"
            onClick={useOriginalPhoto}
            disabled={saving}
            className={`min-h-11 ${buttonClass("secondary")}`}
          >
            Use the original photo
          </button>
        )}
        <div>
          <AdminTextArea
            label="Describe who's in this photo (English)"
            value={altDraft}
            onChange={(event) => setAltDraft(event.target.value)}
            rows={3}
            maxLength={600}
            disabled={saving}
            aria-invalid={altError ? true : undefined}
            aria-describedby={altError ? "photo-alt-error" : undefined}
          />
          <p className="mt-1 text-sm text-stone">For visitors using screen readers.</p>
          {altError && (
            <p id="photo-alt-error" role="alert" className="mt-1 text-sm font-medium text-magenta-deep">
              {altError}
            </p>
          )}
        </div>
        <AdminTextArea
          label="Describe who's in this photo (Japanese, optional)"
          value={altJaDraft}
          onChange={(event) => setAltJaDraft(event.target.value)}
          rows={3}
          maxLength={600}
          disabled={saving}
        />
        {error && <AdminAlert>{error}</AdminAlert>}
        <div className="flex flex-wrap gap-3">
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
            onClick={() => {
              if (!saving) setOpen(false);
            }}
            aria-disabled={saving}
            className={`min-h-12 ${buttonClass("secondary")}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </EditDialog>
  );

  return { renderPhotoEdit, dialog };
}
