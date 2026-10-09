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
import type { SchoolLevel, SchoolLevelStatus } from "@/db/schema";
import { createSchoolLevel, updateSchoolLevel, type LevelInput, type PhotoUrlInput } from "./actions";
import { SCHOOL_LEVEL_STATUS_OPTIONS } from "./status";

const NAME_MAX = 80;
const KANJI_MAX = 8;
const SUMMARY_MAX = 160;
const DESCRIPTION_MAX = 1200;

export function LevelForm({ level }: { level?: SchoolLevel }) {
  const router = useRouter();

  const [name, setName] = useState(level?.name ?? "");
  const [nameJa, setNameJa] = useState(level?.nameJa ?? "");
  const [kanji, setKanji] = useState(level?.kanji ?? "");
  const [summary, setSummary] = useState(level?.summary ?? "");
  const [summaryJa, setSummaryJa] = useState(level?.summaryJa ?? "");
  const [status, setStatus] = useState<SchoolLevelStatus>(level?.status ?? "open");
  const [description, setDescription] = useState(level?.description ?? "");
  const [descriptionJa, setDescriptionJa] = useState(level?.descriptionJa ?? "");
  const [points, setPoints] = useState((level?.points ?? []).join("\n"));
  const [pointsJa, setPointsJa] = useState((level?.pointsJa ?? []).join("\n"));
  const [photoAlt, setPhotoAlt] = useState(level?.photoAlt ?? "");
  const [photoAltJa, setPhotoAltJa] = useState(level?.photoAltJa ?? "");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(level?.photoUrl ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPhoto = previewUrl !== null;
  const missing: string[] = [];
  if (!name.trim()) missing.push("a name");
  if (!summary.trim()) missing.push("a one-line summary");
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
      const result = await upload(`school/levels/${photoFile.name}`, photoFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      return result.url;
    }
    if (photoRemoved) return null;
    return "unchanged";
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (missing.length > 0) {
      setError("Please fill in every required field before saving.");
      return;
    }
    setBusy(true);
    try {
      const photoUrl = await resolvePhotoUrl();
      const input: LevelInput = {
        name,
        nameJa,
        kanji,
        summary,
        summaryJa,
        status,
        description,
        descriptionJa,
        points,
        pointsJa,
        photoAlt,
        photoAltJa,
      };

      if (level) {
        await updateSchoolLevel(level.id, input, photoUrl);
      } else {
        await createSchoolLevel(input, photoUrl === "unchanged" ? null : photoUrl);
      }

      router.push("/admin/levels");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving this class level. Please try again."
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
              Name <AdminRequired />
            </>
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          placeholder="e.g. Beginning Level Japanese"
        />
        <AdminCharacterCount value={name} max={NAME_MAX} />
        <div className="mt-5">
          <AdminTextField
            label="Japanese name (optional)"
            value={nameJa}
            onChange={(e) => setNameJa(e.target.value)}
            maxLength={NAME_MAX}
            placeholder="e.g. 初級クラス"
          />
        </div>
        <div className="mt-5">
          <AdminTextField
            label="Short kanji label shown on the photo plaque (optional)"
            value={kanji}
            onChange={(e) => setKanji(e.target.value)}
            maxLength={KANJI_MAX}
            placeholder="e.g. 初級"
          />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={2}>One-line summary</AdminCardHeading>
        <div className="mt-4">
          <AdminTextField
            label={
              <>
                Summary <AdminRequired />
              </>
            }
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={SUMMARY_MAX}
            placeholder="e.g. No prior language knowledge required"
          />
          <AdminCharacterCount value={summary} max={SUMMARY_MAX} />
        </div>
        <div className="mt-5">
          <AdminTextField
            label="Japanese summary (optional)"
            value={summaryJa}
            onChange={(e) => setSummaryJa(e.target.value)}
            maxLength={SUMMARY_MAX}
          />
        </div>
        <p className="mt-3 text-xs text-stone">
          Shown beside the class name on the list of classes.
        </p>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={3}>Description</AdminCardHeading>
        <div className="mt-4">
          <AdminTextArea
            label={
              <>
                Description <AdminRequired />
              </>
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESCRIPTION_MAX}
            rows={6}
            placeholder="Describe what students learn in this class…"
          />
          <AdminCharacterCount value={description} max={DESCRIPTION_MAX} />
        </div>
        <div className="mt-5">
          <AdminTextArea
            label="Japanese description (optional)"
            value={descriptionJa}
            onChange={(e) => setDescriptionJa(e.target.value)}
            maxLength={DESCRIPTION_MAX}
            rows={6}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={4} tag={<AdminOptional />}>
          What students do in this class
        </AdminCardHeading>
        <div className="mt-4">
          <AdminTextArea
            label="One per line"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            rows={4}
            placeholder={"Ages 6 and up\nEmphasis on listening and speaking"}
          />
        </div>
        <div className="mt-5">
          <AdminTextArea
            label="Japanese (optional)"
            value={pointsJa}
            onChange={(e) => setPointsJa(e.target.value)}
            rows={4}
          />
        </div>
        <p className="mt-3 text-xs text-stone">
          Shown as a bulleted list under the description. One item per line.
        </p>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={5} tag={<AdminOptional />}>
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
            placeholder="e.g. Kindergarten students with their teachers"
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
          Describe the photo for people who can&apos;t see it.
        </p>
      </AdminCard>

      <AdminCard>
        <AdminCardHeading step={6}>Status</AdminCardHeading>
        <div className="mt-4">
          <AdminSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SchoolLevelStatus)}
          >
            {SCHOOL_LEVEL_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminSelect>
        </div>
        <p className="mt-3 text-sm text-stone">
          “Currently unavailable” shows a notice on the class page instead of
          hiding it.
        </p>
      </AdminCard>

      <div className="space-y-4">
        {error && <AdminAlert>{error}</AdminAlert>}
        {missing.length > 0 && (
          <AdminRequirements missing={missing} action="save this class level" />
        )}
        <AdminFormActions>
          <AdminButton onClick={() => router.push("/admin/levels")}>
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
