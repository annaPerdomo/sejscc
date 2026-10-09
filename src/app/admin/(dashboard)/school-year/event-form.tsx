"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { AdminAlert, AdminRequirements } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import { AdminCard, AdminCardHeading, AdminStep } from "@/components/admin/admin-card";
import {
  AdminCharacterCount,
  AdminOptional,
  AdminRequired,
  AdminSelect,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-field";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import type { SchoolYearEvent } from "@/db/schema";
import {
  createSchoolYearEvent,
  updateSchoolYearEvent,
  type PhotoUrlInput,
  type SchoolYearEventFormInput,
} from "./actions";
import { MONTH_OPTIONS } from "./months";

const TITLE_MAX = 80;
const WHEN_MAX = 80;
const LABEL_MAX = 40;
const DESCRIPTION_MAX = 600;
const TERM_JA_MAX = 40;
const GLOSS_MAX = 80;
const ABBR_MAX = 12;

export function EventForm({ event }: { event?: SchoolYearEvent }) {
  const router = useRouter();

  const [title, setTitle] = useState(event?.title ?? "");
  const [titleJa, setTitleJa] = useState(event?.titleJa ?? "");
  const [termJa, setTermJa] = useState(event?.termJa ?? "");
  const [gloss, setGloss] = useState(event?.gloss ?? "");
  const [glossJa, setGlossJa] = useState(event?.glossJa ?? "");
  const [month, setMonth] = useState(event?.month ?? MONTH_OPTIONS[0].value);
  const [when, setWhen] = useState(event?.when ?? "");
  const [whenJa, setWhenJa] = useState(event?.whenJa ?? "");
  const [label, setLabel] = useState(event?.label ?? "");
  const [labelJa, setLabelJa] = useState(event?.labelJa ?? "");
  const [abbr, setAbbr] = useState(event?.abbr ?? "");
  const [abbrJa, setAbbrJa] = useState(event?.abbrJa ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [descriptionJa, setDescriptionJa] = useState(event?.descriptionJa ?? "");
  const [photoAlt, setPhotoAlt] = useState(event?.photoAlt ?? "");
  const [photoAltJa, setPhotoAltJa] = useState(event?.photoAltJa ?? "");
  const [visible, setVisible] = useState(event?.visible ?? true);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(event?.photoUrl ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPhoto = previewUrl !== null;
  const missing: string[] = [];
  if (!title.trim()) missing.push("the event's English name");
  if (!termJa.trim()) missing.push("the Japanese name shown as the accent");
  if (!gloss.trim()) missing.push("what the event means");
  if (!when.trim()) missing.push("when it happens");
  if (!label.trim()) missing.push("a short label");
  if (!abbr.trim()) missing.push("a month abbreviation");
  if (!description.trim()) missing.push("a description");
  if (hasPhoto && !photoAlt.trim()) missing.push("a description of the photo");

  function onPickPhoto(file: File | null) {
    setError(null);
    if (!file) return;
    setPhotoFile(file);
    setPhotoRemoved(false);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhotoFile(null);
    setPreviewUrl(null);
    setPhotoRemoved(true);
  }

  async function resolvePhotoUrl(): Promise<PhotoUrlInput> {
    if (photoFile) {
      const result = await upload(`school/year/${photoFile.name}`, photoFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      return result.url;
    }
    if (photoRemoved) return null;
    return "unchanged";
  }

  async function save(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (busy) return;
    setError(null);
    if (missing.length > 0) {
      setError("Please fill in every required field before saving.");
      return;
    }
    setBusy(true);
    try {
      const photoUrl = await resolvePhotoUrl();
      const input: SchoolYearEventFormInput = {
        title,
        titleJa,
        label,
        labelJa,
        month,
        when,
        whenJa,
        abbr,
        abbrJa,
        termJa,
        gloss,
        glossJa,
        description,
        descriptionJa,
        photoAlt,
        photoAltJa,
        visible,
      };

      if (event) {
        await updateSchoolYearEvent(event.id, input, photoUrl);
      } else {
        await createSchoolYearEvent(input, photoUrl === "unchanged" ? null : photoUrl);
      }

      router.push("/admin/school-year");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving this event. Please try again."
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <AdminCard>
        <AdminTextField
          size="lg"
          badge={<AdminStep n={1} />}
          label={
            <>
              Event name (English) <AdminRequired />
            </>
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="e.g. Undokai"
        />
        <AdminCharacterCount value={title} max={TITLE_MAX} />
        <div className="mt-5">
          <AdminTextField
            label="Event name (Japanese, optional)"
            value={titleJa}
            onChange={(e) => setTitleJa(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="e.g. 運動会"
          />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={2}>Japanese name shown as the accent</AdminCardHeading>
        <div className="mt-4">
          <AdminTextField
            label={
              <>
                Japanese name <AdminRequired />
              </>
            }
            value={termJa}
            onChange={(e) => setTermJa(e.target.value)}
            maxLength={TERM_JA_MAX}
            placeholder="e.g. 運動会"
          />
          <AdminCharacterCount value={termJa} max={TERM_JA_MAX} />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={3}>What it means</AdminCardHeading>
        <div className="mt-4">
          <AdminTextField
            label={
              <>
                English <AdminRequired />
              </>
            }
            value={gloss}
            onChange={(e) => setGloss(e.target.value)}
            maxLength={GLOSS_MAX}
            placeholder="e.g. A day of athletic competition"
          />
          <AdminCharacterCount value={gloss} max={GLOSS_MAX} />
        </div>
        <div className="mt-5">
          <AdminTextField
            label="Japanese (optional)"
            value={glossJa}
            onChange={(e) => setGlossJa(e.target.value)}
            maxLength={GLOSS_MAX}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={4}>Month</AdminCardHeading>
        <div className="mt-4">
          <AdminSelect
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminSelect>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={5}>When</AdminCardHeading>
        <div className="mt-4">
          <AdminTextField
            label={
              <>
                English <AdminRequired />
              </>
            }
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            maxLength={WHEN_MAX}
            placeholder="e.g. Second Saturday in October"
          />
          <AdminCharacterCount value={when} max={WHEN_MAX} />
        </div>
        <div className="mt-5">
          <AdminTextField
            label="Japanese (optional)"
            value={whenJa}
            onChange={(e) => setWhenJa(e.target.value)}
            maxLength={WHEN_MAX}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={6}>Short label</AdminCardHeading>
        <div className="mt-4">
          <AdminTextField
            label={
              <>
                English <AdminRequired />
              </>
            }
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={LABEL_MAX}
            placeholder="e.g. Field Day"
          />
          <AdminCharacterCount value={label} max={LABEL_MAX} />
        </div>
        <div className="mt-5">
          <AdminTextField
            label="Japanese (optional)"
            value={labelJa}
            onChange={(e) => setLabelJa(e.target.value)}
            maxLength={LABEL_MAX}
          />
        </div>
        <p className="mt-3 text-xs text-stone">
          Shown on the small tab the reader taps to jump to this event.
        </p>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={7}>Month abbreviation</AdminCardHeading>
        <div className="mt-4">
          <AdminTextField
            label={
              <>
                English <AdminRequired />
              </>
            }
            value={abbr}
            onChange={(e) => setAbbr(e.target.value)}
            maxLength={ABBR_MAX}
            placeholder="e.g. Oct"
          />
          <AdminCharacterCount value={abbr} max={ABBR_MAX} />
        </div>
        <div className="mt-5">
          <AdminTextField
            label="Japanese (optional)"
            value={abbrJa}
            onChange={(e) => setAbbrJa(e.target.value)}
            maxLength={ABBR_MAX}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={8}>Description</AdminCardHeading>
        <div className="mt-4">
          <AdminTextArea
            label={
              <>
                English <AdminRequired />
              </>
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESCRIPTION_MAX}
            rows={6}
            placeholder="Describe what happens at this event…"
          />
          <AdminCharacterCount value={description} max={DESCRIPTION_MAX} />
        </div>
        <div className="mt-5">
          <AdminTextArea
            label="Japanese (optional)"
            value={descriptionJa}
            onChange={(e) => setDescriptionJa(e.target.value)}
            maxLength={DESCRIPTION_MAX}
            rows={6}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={9} tag={<AdminOptional />}>
          Photo
        </AdminCardHeading>
        <div className="mt-4">
          <AdminImagePicker
            label="Photo"
            value={photoRemoved ? null : previewUrl}
            onFileChosen={onPickPhoto}
            onRemove={previewUrl ? removePhoto : undefined}
            layout="dropzone"
          />
        </div>
        <div className="mt-5">
          <AdminTextField
            label={
              hasPhoto ? (
                <>
                  Describe the photo (English) <AdminRequired />
                </>
              ) : (
                "Describe the photo (English)"
              )
            }
            value={photoAlt}
            onChange={(e) => setPhotoAlt(e.target.value)}
            placeholder="e.g. Students racing on the field during Undokai"
          />
        </div>
        <div className="mt-5">
          <AdminTextField
            label="(Japanese, optional)"
            value={photoAltJa}
            onChange={(e) => setPhotoAltJa(e.target.value)}
          />
        </div>
        <p className="mt-3 text-xs text-stone">
          Describe the photo for people who can&apos;t see it. An event
          without a photo won&apos;t appear on the website.
        </p>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={10}>Show on website</AdminCardHeading>
        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="size-5 rounded border-line text-indigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo"
          />
          <span className="text-sm text-ink">
            Show this event on the school page
          </span>
        </label>
      </AdminCard>

      <div className="space-y-4">
        {error && <AdminAlert>{error}</AdminAlert>}
        {missing.length > 0 && (
          <AdminRequirements missing={missing} action="save this event" />
        )}
        <AdminFormActions>
          <AdminButton onClick={() => router.push("/admin/school-year")}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </AdminFormActions>
      </div>
    </form>
  );
}
