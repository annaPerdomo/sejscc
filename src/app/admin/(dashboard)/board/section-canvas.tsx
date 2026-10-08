"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { AdminAlert } from "@/components/admin/admin-alert";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminTextArea } from "@/components/admin/admin-field";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import { EditBar, type EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import { EditDialog } from "@/components/admin/inline-edit/edit-dialog";
import { EditableText } from "@/components/admin/inline-edit/editable-text";
import { useUnsavedChangesGuard } from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import {
  VolunteerSection,
  type SectionTextField,
  type VolunteerSectionLabels,
} from "@/components/volunteer-section";
import type { BoardMember, VolunteerRole, VolunteerSectionRow } from "@/db/schema";
import type { Locale } from "@/lib/i18n";
import type { ImageSize } from "@/lib/image-size";
import { boardPhoto } from "@/lib/photos";
import {
  SECTION_TEXT_FIELDS,
  englishSectionValue,
  japaneseSectionValue,
  withEnglishSectionValue,
  withJapaneseSectionValue,
} from "@/lib/volunteer-fields";
import { toVolunteerSectionView } from "@/lib/volunteers-view";
import { updateSectionPhoto, updateSectionText } from "./actions";

const FIELD_DISPLAY_LABELS: Record<SectionTextField, string> = {
  title: "Heading",
  intro: "Introduction",
  volunteersNote: "Note about volunteers",
  contactNote: "Contact sentence",
  contactLinkLabel: "Contact link words",
  waysTitle: "Ways to help heading",
  waysIntro: "Ways to help introduction",
};

const FIELD_MULTILINE: Record<SectionTextField, boolean> = {
  title: false,
  intro: true,
  volunteersNote: true,
  contactNote: true,
  contactLinkLabel: false,
  waysTitle: false,
  waysIntro: true,
};

const BLOCKED_MESSAGE = "Save or cancel your change first.";

type PhotoDraft =
  | { kind: "unchanged" }
  | { kind: "removed" }
  | { kind: "file"; file: File; previewUrl: string; uploadedUrl?: string };

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";

export function SectionCanvas({
  section: initialSection,
  members,
  roles,
  photoSize,
  labels,
}: {
  section: VolunteerSectionRow;
  members: BoardMember[];
  roles: VolunteerRole[];
  photoSize: ImageSize | null;
  labels: { en: VolunteerSectionLabels; ja: VolunteerSectionLabels };
}) {
  const router = useRouter();
  const [section, setSection] = useState(initialSection);
  const [lang, setLang] = useState<Locale>("en");
  const [status, setStatus] = useState<EditBarStatus>({ kind: "idle" });

  const [openField, setOpenField] = useState<SectionTextField | null>(null);
  const [openDirty, setOpenDirty] = useState(false);
  const [blocked, setBlocked] = useState<{
    field: SectionTextField;
    message: string;
  } | null>(null);

  useUnsavedChangesGuard(openDirty);

  function attemptOpenField(field: SectionTextField) {
    if (openField && openField !== field && openDirty) {
      setBlocked({ field, message: BLOCKED_MESSAGE });
      return;
    }
    setBlocked(null);
    setOpenField(field);
    setOpenDirty(false);
  }

  function closeField(field: SectionTextField) {
    if (openField !== field) return;
    setOpenField(null);
    setOpenDirty(false);
    setBlocked(null);
  }

  function handleLangChange(nextLang: Locale) {
    if (nextLang === lang) return;
    if (openField) {
      if (openDirty) {
        setStatus({ kind: "error", message: BLOCKED_MESSAGE });
        return;
      }
      setOpenField(null);
    }
    setBlocked(null);
    setLang(nextLang);
  }

  function renderTextEdit(field: SectionTextField): ReactNode {
    const isOpen = openField === field;
    const englishText = englishSectionValue(section, field);
    const value = lang === "en" ? englishText : japaneseSectionValue(section, field);
    const noun = lang === "en" ? SECTION_TEXT_FIELDS[field].label : `Japanese ${SECTION_TEXT_FIELDS[field].label}`;

    return (
      <EditableText
        key={`${field}-${lang}`}
        label={`${FIELD_DISPLAY_LABELS[field]} — ${lang === "en" ? "English" : "Japanese"}`}
        noun={noun}
        value={value}
        fallback={lang === "ja" ? englishText : undefined}
        multiline={FIELD_MULTILINE[field]}
        maxLength={SECTION_TEXT_FIELDS[field].max}
        required={lang === "en"}
        isOpen={isOpen}
        onOpen={() => attemptOpenField(field)}
        onClose={() => closeField(field)}
        blocked={blocked?.field === field ? blocked.message : undefined}
        onDirtyChange={(dirty) => {
          if (isOpen) setOpenDirty(dirty);
        }}
        onSave={async (next) => {
          const previous = section;
          setSection(
            lang === "en"
              ? withEnglishSectionValue(section, field, next.trim())
              : withJapaneseSectionValue(section, field, next.trim() || null)
          );
          setStatus({ kind: "saving" });
          try {
            await updateSectionText(field, lang, next);
            setStatus({ kind: "saved" });
            router.refresh();
          } catch (e) {
            setSection(previous);
            const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
            setStatus({ kind: "error", message });
            throw e;
          }
        }}
      />
    );
  }

  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft>({ kind: "unchanged" });
  const [photoAltDraft, setPhotoAltDraft] = useState(section.photoAlt);
  const [photoAltJaDraft, setPhotoAltJaDraft] = useState(section.photoAltJa ?? "");
  const [photoAltError, setPhotoAltError] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const photoPreviewUrl = photoDraft.kind === "file" ? photoDraft.previewUrl : null;
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function openPhotoDialog() {
    setPhotoDraft({ kind: "unchanged" });
    setPhotoAltDraft(section.photoAlt);
    setPhotoAltJaDraft(section.photoAltJa ?? "");
    setPhotoAltError(null);
    setPhotoError(null);
    setPhotoDialogOpen(true);
  }

  function onPhotoFileChosen(file: File | null) {
    if (!file) return;
    setPhotoDraft({ kind: "file", file, previewUrl: URL.createObjectURL(file) });
  }

  function useOriginalPhoto() {
    setPhotoDraft(section.photoUrl !== null ? { kind: "removed" } : { kind: "unchanged" });
  }

  async function handleSavePhoto() {
    if (photoSaving) return;
    if (!photoAltDraft.trim()) {
      setPhotoAltError("Please fill in the English photo description.");
      return;
    }
    setPhotoAltError(null);
    setPhotoError(null);
    setPhotoSaving(true);

    const previousSection = section;
    try {
      let photoUrl: string | null;
      if (photoDraft.kind === "file") {
        if (photoDraft.uploadedUrl) {
          photoUrl = photoDraft.uploadedUrl;
        } else {
          const result = await upload(`board/${photoDraft.file.name}`, photoDraft.file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          photoUrl = result.url;
          const uploadedUrl = photoUrl;
          setPhotoDraft((current) =>
            current.kind === "file" ? { ...current, uploadedUrl } : current
          );
        }
      } else if (photoDraft.kind === "removed") {
        photoUrl = null;
      } else {
        photoUrl = section.photoUrl;
      }

      const photoAlt = photoAltDraft.trim();
      const photoAltJa = photoAltJaDraft.trim();

      setSection({ ...section, photoUrl, photoAlt, photoAltJa: photoAltJa || null });
      setStatus({ kind: "saving" });

      await updateSectionPhoto({ photoUrl, photoAlt, photoAltJa });

      setStatus({ kind: "saved" });
      setPhotoDialogOpen(false);
      router.refresh();
    } catch (e) {
      setSection(previousSection);
      const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
      setPhotoError(message);
      setStatus({ kind: "error", message });
    } finally {
      setPhotoSaving(false);
    }
  }

  function renderPhotoEdit(image: ReactNode): ReactNode {
    return (
      <>
        {image}
        <button
          type="button"
          onClick={openPhotoDialog}
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
    photoDraft.kind === "file"
      ? photoDraft.previewUrl
      : photoDraft.kind === "removed"
        ? null
        : section.photoUrl;

  const view = toVolunteerSectionView(section, members, roles, lang, photoSize);

  return (
    <div>
      <EditBar lang={lang} onLangChange={handleLangChange} status={status} />

      <div className="section-wash-history relative overflow-clip py-10 sm:py-14">
        <div className="preview-static">
          <VolunteerSection
            view={view}
            labels={lang === "en" ? labels.en : labels.ja}
            contactHref="#"
            edit={{
              text: renderTextEdit,
              photo: renderPhotoEdit,
            }}
          />
        </div>
      </div>

      <EditDialog
        title="Change the photo"
        open={photoDialogOpen}
        busy={photoSaving}
        onClose={() => setPhotoDialogOpen(false)}
      >
        <div className="space-y-5">
          <AdminImagePicker
            label="Photo"
            hint="A clear photo of the board or volunteers."
            value={photoValue}
            fallbackSrc={boardPhoto.src}
            onFileChosen={onPhotoFileChosen}
            disabled={photoSaving}
          />
          {(photoDraft.kind === "file" ||
            (photoDraft.kind === "unchanged" && section.photoUrl !== null)) && (
            <button
              type="button"
              onClick={useOriginalPhoto}
              disabled={photoSaving}
              className={`min-h-11 ${buttonClass("secondary")}`}
            >
              Use the original photo
            </button>
          )}
          <div>
            <AdminTextArea
              label="Describe who's in this photo (English)"
              value={photoAltDraft}
              onChange={(event) => setPhotoAltDraft(event.target.value)}
              rows={3}
              maxLength={600}
              disabled={photoSaving}
              aria-invalid={photoAltError ? true : undefined}
              aria-describedby={photoAltError ? "photo-alt-error" : undefined}
            />
            <p className="mt-1 text-sm text-stone">For visitors using screen readers.</p>
            {photoAltError && (
              <p id="photo-alt-error" role="alert" className="mt-1 text-sm font-medium text-magenta-deep">
                {photoAltError}
              </p>
            )}
          </div>
          <AdminTextArea
            label="Describe who's in this photo (Japanese, optional)"
            value={photoAltJaDraft}
            onChange={(event) => setPhotoAltJaDraft(event.target.value)}
            rows={3}
            maxLength={600}
            disabled={photoSaving}
          />
          {photoError && <AdminAlert>{photoError}</AdminAlert>}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSavePhoto()}
              aria-disabled={photoSaving}
              className={`min-h-12 ${buttonClass("primary")}`}
            >
              {photoSaving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!photoSaving) setPhotoDialogOpen(false);
              }}
              aria-disabled={photoSaving}
              className={`min-h-12 ${buttonClass("secondary")}`}
            >
              Cancel
            </button>
          </div>
        </div>
      </EditDialog>
    </div>
  );
}
