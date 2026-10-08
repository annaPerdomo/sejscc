"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminBilingualField } from "@/components/admin/admin-bilingual-field";
import { AdminCard, AdminCardHeading } from "@/components/admin/admin-card";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import {
  VolunteerSection,
  type VolunteerSectionLabels,
} from "@/components/volunteer-section";
import type { BoardMember, VolunteerRole, VolunteerSectionRow } from "@/db/schema";
import type { ImageSize } from "@/lib/image-size";
import { boardPhoto } from "@/lib/photos";
import { DEFAULT_PHOTO_SIZE, toVolunteerSectionView } from "@/lib/volunteers-view";
import { updateVolunteerSection, type VolunteerSectionInput } from "./actions";

type Fields = Omit<VolunteerSectionInput, "photoUrl">;

type PhotoState =
  | { kind: "unchanged" }
  | { kind: "removed" }
  | { kind: "file"; file: File; previewUrl: string; uploadedUrl?: string };

const PREVIEW_PANEL_ID = "board-preview-panel";

function fieldsFromSection(section: VolunteerSectionRow): Fields {
  return {
    title: section.title,
    titleJa: section.titleJa ?? "",
    intro: section.intro,
    introJa: section.introJa ?? "",
    photoAlt: section.photoAlt,
    photoAltJa: section.photoAltJa ?? "",
    volunteersNote: section.volunteersNote,
    volunteersNoteJa: section.volunteersNoteJa ?? "",
    contactNote: section.contactNote,
    contactNoteJa: section.contactNoteJa ?? "",
    contactLinkLabel: section.contactLinkLabel,
    contactLinkLabelJa: section.contactLinkLabelJa ?? "",
    waysTitle: section.waysTitle,
    waysTitleJa: section.waysTitleJa ?? "",
    waysIntro: section.waysIntro,
    waysIntroJa: section.waysIntroJa ?? "",
  };
}

const REQUIRED_FIELDS: { key: keyof Fields; label: string }[] = [
  { key: "title", label: "heading" },
  { key: "intro", label: "introduction" },
  { key: "volunteersNote", label: "note about volunteers" },
  { key: "waysTitle", label: "ways to help heading" },
  { key: "waysIntro", label: "ways to help introduction" },
  { key: "contactNote", label: "contact sentence" },
  { key: "contactLinkLabel", label: "contact link words" },
  { key: "photoAlt", label: "photo description" },
];

const FIELD_KEYS: (keyof Fields)[] = [
  "title",
  "titleJa",
  "intro",
  "introJa",
  "photoAlt",
  "photoAltJa",
  "volunteersNote",
  "volunteersNoteJa",
  "contactNote",
  "contactNoteJa",
  "contactLinkLabel",
  "contactLinkLabelJa",
  "waysTitle",
  "waysTitleJa",
  "waysIntro",
  "waysIntroJa",
];

export function SectionEditor({
  section,
  members,
  roles,
  photoSize,
  labels,
  children,
}: {
  section: VolunteerSectionRow;
  members: BoardMember[];
  roles: VolunteerRole[];
  photoSize: ImageSize | null;
  labels: { en: VolunteerSectionLabels; ja: VolunteerSectionLabels };
  children?: ReactNode;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [baselineFields, setBaselineFields] = useState<Fields>(() =>
    fieldsFromSection(section)
  );
  const [baselinePhotoUrl, setBaselinePhotoUrl] = useState<string | null>(
    section.photoUrl
  );
  const [fields, setFields] = useState<Fields>(baselineFields);
  const [photoState, setPhotoState] = useState<PhotoState>({ kind: "unchanged" });
  const [photoDims, setPhotoDims] = useState<ImageSize | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Fields, string>>>(
    {}
  );
  const [previewLang, setPreviewLang] = useState<"en" | "ja">("en");
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const previewUrl = photoState.kind === "file" ? photoState.previewUrl : null;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updateField(key: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setStatus(null);
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function onFileChosen(file: File | null) {
    if (!file) return;
    const nextPreviewUrl = URL.createObjectURL(file);
    setPhotoState({ kind: "file", file, previewUrl: nextPreviewUrl });
    setPhotoDims(null);
    setStatus(null);
    const image = new window.Image();
    image.onload = () =>
      setPhotoDims({ width: image.naturalWidth, height: image.naturalHeight });
    image.src = nextPreviewUrl;
  }

  function useOriginalPhoto() {
    setPhotoState(baselinePhotoUrl !== null ? { kind: "removed" } : { kind: "unchanged" });
    setPhotoDims(null);
    setStatus(null);
  }

  const hasCustomPhoto =
    photoState.kind === "file" ||
    (photoState.kind === "unchanged" && baselinePhotoUrl !== null);

  function validate() {
    const errors: Partial<Record<keyof Fields, string>> = {};
    for (const { key, label } of REQUIRED_FIELDS) {
      if (!fields[key].trim()) errors[key] = `Please fill in the English ${label}.`;
    }
    return errors;
  }

  const fieldsDirty = FIELD_KEYS.some((key) => fields[key] !== baselineFields[key]);

  const photoDirty =
    photoState.kind === "file" ||
    (photoState.kind === "removed" && baselinePhotoUrl !== null);

  const dirty = fieldsDirty || photoDirty;

  // Capture phase so we can cancel before the link's own navigation runs.
  // Links inside this form (save bar, inert preview) are skipped as safe.
  useEffect(() => {
    if (!dirty) return;
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      if (formRef.current?.contains(anchor)) return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  function focusFirstError(errors: Partial<Record<keyof Fields, string>>) {
    const firstKey = REQUIRED_FIELDS.find(({ key }) => errors[key])?.key;
    if (!firstKey) return;
    const field = document.getElementById(firstKey);
    if (!field) return;
    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus();
  }

  async function handleSave() {
    if (busy) return;
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields above.");
      setStatus(null);
      focusFirstError(errors);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let photoUrl: string | null;
      if (photoState.kind === "file") {
        if (photoState.uploadedUrl) {
          photoUrl = photoState.uploadedUrl;
        } else {
          const result = await upload(`board/${photoState.file.name}`, photoState.file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          photoUrl = result.url;
          setPhotoState({ ...photoState, uploadedUrl: photoUrl });
        }
      } else if (photoState.kind === "removed") {
        photoUrl = null;
      } else {
        photoUrl = baselinePhotoUrl;
      }

      const input: VolunteerSectionInput = { ...fields, photoUrl };
      await updateVolunteerSection(input);

      setBaselineFields(fields);
      setBaselinePhotoUrl(photoUrl);
      setPhotoState({ kind: "unchanged" });
      setPhotoDims(null);
      setStatus("Saved — your changes are live on the website");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving the section. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  function handleDiscard() {
    setFields(baselineFields);
    setPhotoState({ kind: "unchanged" });
    setPhotoDims(null);
    setFieldErrors({});
    setError(null);
    setStatus(null);
  }

  const photoValue =
    photoState.kind === "file"
      ? photoState.previewUrl
      : photoState.kind === "removed"
        ? null
        : baselinePhotoUrl;

  const previewRow: VolunteerSectionRow = {
    id: section.id,
    updatedAt: section.updatedAt,
    photoUrl: photoState.kind === "unchanged" ? baselinePhotoUrl : null,
    title: fields.title,
    titleJa: fields.titleJa || null,
    intro: fields.intro,
    introJa: fields.introJa || null,
    photoAlt: fields.photoAlt,
    photoAltJa: fields.photoAltJa || null,
    volunteersNote: fields.volunteersNote,
    volunteersNoteJa: fields.volunteersNoteJa || null,
    contactNote: fields.contactNote,
    contactNoteJa: fields.contactNoteJa || null,
    contactLinkLabel: fields.contactLinkLabel,
    contactLinkLabelJa: fields.contactLinkLabelJa || null,
    waysTitle: fields.waysTitle,
    waysTitleJa: fields.waysTitleJa || null,
    waysIntro: fields.waysIntro,
    waysIntroJa: fields.waysIntroJa || null,
  };

  const previewPhotoSize = photoState.kind === "unchanged" ? photoSize : null;
  const previewView = toVolunteerSectionView(
    previewRow,
    members,
    roles,
    previewLang,
    previewPhotoSize
  );
  if (photoState.kind === "file") {
    previewView.photo = {
      src: photoState.previewUrl,
      width: photoDims?.width ?? DEFAULT_PHOTO_SIZE.width,
      height: photoDims?.height ?? DEFAULT_PHOTO_SIZE.height,
    };
  }

  const previewPanel = (
    <div id={PREVIEW_PANEL_ID} className="rounded-xl border border-line bg-paper p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Preview language"
          className="inline-flex rounded-lg border border-line p-1"
        >
          <button
            type="button"
            aria-pressed={previewLang === "en"}
            onClick={() => setPreviewLang("en")}
            className={`min-h-11 rounded-md px-3 text-sm font-semibold ${
              previewLang === "en" ? "bg-indigo text-white" : "text-ink-soft"
            }`}
          >
            English
          </button>
          <button
            type="button"
            aria-pressed={previewLang === "ja"}
            onClick={() => setPreviewLang("ja")}
            className={`min-h-11 rounded-md px-3 text-sm font-semibold ${
              previewLang === "ja" ? "bg-indigo text-white" : "text-ink-soft"
            }`}
          >
            日本語
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-stone">
        This is how it will look on the home page
      </p>
      <div className="preview-static mt-4 max-h-preview overflow-y-auto overflow-x-clip rounded-lg bg-paper">
        <div inert aria-hidden="true" className="origin-top scale-90">
          <VolunteerSection
            view={previewView}
            labels={previewLang === "en" ? labels.en : labels.ja}
            contactHref="#"
            photoIsLocalPreview={photoState.kind === "file"}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-10">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-7">
          <form
            ref={formRef}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
          <div className="space-y-6">
          <AdminCard>
            <AdminCardHeading step={1}>Words</AdminCardHeading>
            <div className="mt-5 space-y-6">
              <AdminBilingualField
                label="Heading"
                hint="Shown in large type above the list of names."
                maxLength={80}
                disabled={busy}
                en={{
                  name: "title",
                  value: fields.title,
                  onChange: (value) => updateField("title", value),
                  error: fieldErrors.title,
                }}
                ja={{
                  name: "titleJa",
                  value: fields.titleJa,
                  onChange: (value) => updateField("titleJa", value),
                }}
              />
              <AdminBilingualField
                label="Introduction"
                hint="The paragraph just below the heading."
                multiline
                maxLength={600}
                disabled={busy}
                en={{
                  name: "intro",
                  value: fields.intro,
                  onChange: (value) => updateField("intro", value),
                  error: fieldErrors.intro,
                }}
                ja={{
                  name: "introJa",
                  value: fields.introJa,
                  onChange: (value) => updateField("introJa", value),
                }}
              />
              <AdminBilingualField
                label="Note about volunteers"
                hint="Shown below the list of board members' names."
                multiline
                maxLength={600}
                disabled={busy}
                en={{
                  name: "volunteersNote",
                  value: fields.volunteersNote,
                  onChange: (value) => updateField("volunteersNote", value),
                  error: fieldErrors.volunteersNote,
                }}
                ja={{
                  name: "volunteersNoteJa",
                  value: fields.volunteersNoteJa,
                  onChange: (value) => updateField("volunteersNoteJa", value),
                }}
              />
              <AdminBilingualField
                label="Ways to help heading"
                hint="Shown above the list of volunteer roles."
                maxLength={80}
                disabled={busy}
                en={{
                  name: "waysTitle",
                  value: fields.waysTitle,
                  onChange: (value) => updateField("waysTitle", value),
                  error: fieldErrors.waysTitle,
                }}
                ja={{
                  name: "waysTitleJa",
                  value: fields.waysTitleJa,
                  onChange: (value) => updateField("waysTitleJa", value),
                }}
              />
              <AdminBilingualField
                label="Ways to help introduction"
                hint="The paragraph just below that heading."
                multiline
                maxLength={600}
                disabled={busy}
                en={{
                  name: "waysIntro",
                  value: fields.waysIntro,
                  onChange: (value) => updateField("waysIntro", value),
                  error: fieldErrors.waysIntro,
                }}
                ja={{
                  name: "waysIntroJa",
                  value: fields.waysIntroJa,
                  onChange: (value) => updateField("waysIntroJa", value),
                }}
              />
              <AdminBilingualField
                label="Contact sentence"
                hint="The sentence that leads into the contact link below."
                maxLength={600}
                disabled={busy}
                en={{
                  name: "contactNote",
                  value: fields.contactNote,
                  onChange: (value) => updateField("contactNote", value),
                  error: fieldErrors.contactNote,
                }}
                ja={{
                  name: "contactNoteJa",
                  value: fields.contactNoteJa,
                  onChange: (value) => updateField("contactNoteJa", value),
                }}
              />
              <AdminBilingualField
                label="Contact link words"
                hint="The linked words right after the contact sentence."
                maxLength={40}
                disabled={busy}
                en={{
                  name: "contactLinkLabel",
                  value: fields.contactLinkLabel,
                  onChange: (value) => updateField("contactLinkLabel", value),
                  error: fieldErrors.contactLinkLabel,
                }}
                ja={{
                  name: "contactLinkLabelJa",
                  value: fields.contactLinkLabelJa,
                  onChange: (value) => updateField("contactLinkLabelJa", value),
                }}
              />
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeading step={2}>Photo</AdminCardHeading>
            <div className="mt-5 space-y-5">
              <AdminImagePicker
                label="Photo"
                hint="A clear photo of the board or volunteers, shown beside the words above."
                value={photoValue}
                fallbackSrc={boardPhoto.src}
                onFileChosen={onFileChosen}
                disabled={busy}
              />
              {hasCustomPhoto && (
                <AdminButton type="button" onClick={useOriginalPhoto} disabled={busy}>
                  Use the original photo
                </AdminButton>
              )}
              <AdminBilingualField
                label="Photo description"
                hint="Describe who is in the photo and what they're doing, for visitors using screen readers. If you change the photo, update this description too."
                multiline
                maxLength={600}
                disabled={busy}
                en={{
                  name: "photoAlt",
                  value: fields.photoAlt,
                  onChange: (value) => updateField("photoAlt", value),
                  error: fieldErrors.photoAlt,
                }}
                ja={{
                  name: "photoAltJa",
                  value: fields.photoAltJa,
                  onChange: (value) => updateField("photoAltJa", value),
                }}
              />
            </div>
          </AdminCard>
          </div>

          <AdminSaveBar
            dirty={dirty}
            saving={busy}
            status={status}
            error={error}
            onSave={() => void handleSave()}
            onDiscard={handleDiscard}
          />
          </form>

          {children}
        </div>

        <div className="lg:sticky lg:top-6 lg:col-span-5">
          <div className="lg:hidden">
            <AdminButton
              type="button"
              variant="primary"
              aria-expanded={mobilePreviewOpen}
              aria-controls={PREVIEW_PANEL_ID}
              onClick={() => setMobilePreviewOpen((open) => !open)}
            >
              {mobilePreviewOpen ? "Hide preview" : "Show preview"}
            </AdminButton>
          </div>
          <div className={`mt-4 ${mobilePreviewOpen ? "block" : "hidden"} lg:mt-0 lg:block`}>
            {previewPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
