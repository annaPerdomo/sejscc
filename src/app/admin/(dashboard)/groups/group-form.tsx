"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import {
  AdminCharacterCount,
  AdminSelect,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-field";
import { weekDays, type GroupStatus, type WeekDay } from "@/db/schema";
import { normalizeContactEmail, normalizeWebsiteUrl } from "@/lib/format";
import { createGroup, updateGroup, type GroupInput } from "./actions";
import { GROUP_STATUS_OPTIONS } from "./status";

type ExistingGroup = {
  id: string;
  name: string;
  nameJa: string | null;
  description: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  meetingSchedule: string | null;
  meetingDays: WeekDay[];
  active: boolean;
  status: GroupStatus;
};

const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function GroupForm({ group }: { group?: ExistingGroup }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(group?.name ?? "");
  const [nameJa, setNameJa] = useState(group?.nameJa ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [meetingSchedule, setMeetingSchedule] = useState(
    group?.meetingSchedule ?? ""
  );
  const [meetingDays, setMeetingDays] = useState<WeekDay[]>(
    group?.meetingDays ?? []
  );
  const [websiteUrl, setWebsiteUrl] = useState(group?.websiteUrl ?? "");
  const [contactEmail, setContactEmail] = useState(group?.contactEmail ?? "");
  const [active, setActive] = useState(group?.active ?? true);
  const [status, setStatus] = useState<GroupStatus>(group?.status ?? "meeting");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    group?.imageUrl ?? null
  );
  const [imageRemoved, setImageRemoved] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: WeekDay) {
    setMeetingDays((current) =>
      weekDays.filter((other) =>
        other === day ? !current.includes(other) : current.includes(other)
      )
    );
  }

  function onPickImage(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("That image is larger than 10MB. Try exporting a smaller one.");
      return;
    }
    setImageFile(file);
    setImageRemoved(false);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setPreviewUrl(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(): Promise<string | null> {
    if (imageFile) {
      const result = await upload(`groups/${imageFile.name}`, imageFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      return result.url;
    }
    if (imageRemoved) return null;
    return group?.imageUrl ?? null;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (!name.trim()) {
      setError("Please enter a group name.");
      return;
    }
    setBusy(true);
    try {
      normalizeWebsiteUrl(websiteUrl);
      normalizeContactEmail(contactEmail);
      const input: GroupInput = {
        name,
        nameJa,
        description,
        meetingSchedule,
        meetingDays,
        websiteUrl,
        contactEmail,
        active,
        status,
        imageUrl: await uploadImage(),
      };
      if (group) {
        await updateGroup(group.id, input);
      } else {
        await createGroup(input);
      }
      router.push("/admin/groups");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving the group. Please try again."
      );
      setBusy(false);
    }
  }

  const daysReminder =
    meetingDays.length > 0
      ? `Check that it still matches the days above: ${meetingDays
          .map((day) => DAY_LABELS[day])
          .join(", ")}.`
      : "Include the days the group meets, and check them above too.";

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <AdminCard>
        <AdminTextField
          size="lg"
          label={
            <>
              Group Name{" "}
              <span className="text-sm font-normal text-stone">(required)</span>
            </>
          }
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Enter the group’s name…"
        />
        <AdminCharacterCount value={name} max={100} />
        <div className="mt-5">
          <AdminTextField
            label="Japanese name (optional)"
            value={nameJa}
            onChange={(e) => setNameJa(e.target.value)}
            maxLength={60}
            placeholder="e.g. 柔道"
          />
        </div>
        <p className="mt-2 text-xs text-stone">
          Shown in small type beside the group’s name on the website.
        </p>
      </AdminCard>

      <AdminCard>
        <h2 className="font-semibold text-ink">
          Photo or Logo{" "}
          <span className="text-sm font-normal text-stone">(optional)</span>
        </h2>
        <div className="mt-4 flex flex-wrap items-start gap-5">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Group photo preview"
              className="h-28 w-28 rounded-lg border border-line bg-mist object-cover shadow-sm"
            />
          )}
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line p-3 text-center text-sm text-stone hover:border-indigo hover:text-indigo"
            >
              <span className="text-2xl">↑</span>
              {previewUrl ? "Replace" : "Upload"}
              <span className="text-xs">JPG, PNG, or WebP</span>
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={removeImage}
                className="text-sm font-medium text-indigo-deep hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onPickImage(e.target.files?.[0])}
          />
        </div>
        <p className="mt-3 text-xs text-stone">
          Shown across the top of the group’s card on the website. A photo or
          a logo both work — it is fitted inside the card, never cropped.
        </p>
      </AdminCard>

      <AdminCard>
        <h2 className="font-semibold text-ink">
          Details{" "}
          <span className="text-sm font-normal text-stone">(optional)</span>
        </h2>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-stone">
            Which days does this group meet?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {weekDays.map((day) => (
              <label
                key={day}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-ink hover:border-indigo has-checked:border-indigo has-checked:bg-mist"
              >
                <input
                  type="checkbox"
                  checked={meetingDays.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="h-4 w-4 accent-indigo"
                />
                {DAY_LABELS[day]}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone">
            Builds the “A week at the center” schedule on the Groups page.
            Leave every day unchecked if the group has no set meeting day.
          </p>
        </fieldset>
        <div className="mt-5">
          <AdminTextField
            label="Meeting schedule"
            value={meetingSchedule}
            onChange={(e) => setMeetingSchedule(e.target.value)}
            maxLength={100}
            placeholder="e.g. Tuesdays & Thursdays, 7:00–9:00 PM"
          />
        </div>
        <p className="mt-2 text-xs text-stone">
          Printed on the group’s card word for word. {daysReminder}
        </p>
        <div className="mt-5">
          <AdminTextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={5}
            placeholder="Tell people what the group does and who can join…"
          />
        </div>
        <AdminCharacterCount value={description} max={500} />
      </AdminCard>

      <AdminCard>
        <h2 className="font-semibold text-ink">
          Website &amp; Contact{" "}
          <span className="text-sm font-normal text-stone">(optional)</span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AdminTextField
            label="Website"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            inputMode="url"
            placeholder="e.g. example.org"
          />
          <AdminTextField
            label="Contact email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="e.g. name@example.org"
          />
        </div>
        <p className="mt-3 text-xs text-stone">
          Both appear as links on the group’s card so people can reach the group
          directly.
        </p>
      </AdminCard>

      <AdminCard>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-1 h-5 w-5 accent-indigo"
          />
          <span>
            <span className="block font-semibold text-ink">
              Show this group on the website
            </span>
            <span className="mt-0.5 block text-sm text-stone">
              Uncheck to hide the group without deleting it.
            </span>
          </span>
        </label>
      </AdminCard>

      <AdminCard>
        <AdminSelect
          label="Meeting status"
          value={status}
          onChange={(e) => setStatus(e.target.value as GroupStatus)}
        >
          {GROUP_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelect>
        <p className="mt-3 text-sm text-stone">
          Paused and discontinued groups stay on the website — with a label
          showing their status — but move to the bottom of the list instead
          of needing to be manually reordered.
        </p>
      </AdminCard>

      <div className="space-y-4">
        {error && <AdminAlert>{error}</AdminAlert>}
        <AdminFormActions>
          <AdminButton onClick={() => router.push("/admin/groups")}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save Group"}
          </AdminButton>
        </AdminFormActions>
      </div>
    </form>
  );
}
