"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { EventRepeat } from "@/db/schema";
import { CENTER_ADDRESS, venueLabel } from "@/lib/center";
import { normalizeWebsiteUrl } from "@/lib/format";
import { pdfFirstPageToPng } from "@/lib/pdf-preview";
import {
  describeRepeat,
  upcomingOccurrences,
  type RepeatingEvent,
  type RepeatPhrases,
} from "@/lib/recurrence";
import { AdminAlert, AdminRequirements } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import {
  AdminCard,
  AdminCardHeading,
  AdminStep,
} from "@/components/admin/admin-card";
import {
  AdminCharacterCount,
  AdminOptional,
  AdminRequired,
  AdminSelect,
  AdminTextArea,
  AdminTextField,
} from "@/components/admin/admin-field";
import { EventDescriptionMedia } from "@/components/event-media";
import { EventMeta } from "@/components/event-meta";
import { createEvent, updateEvent, type EventInput } from "./actions";

const REPEAT_OPTIONS: { value: EventRepeat; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every other week" },
  { value: "monthly", label: "Every month" },
];

type ExistingEvent = {
  id: string;
  title: string;
  description: string | null;
  flyerUrl: string | null;
  flyerDownloadUrl: string | null;
  signupUrl: string | null;
  startAt: Date | null;
  endAt: Date | null;
  repeat: EventRepeat;
  repeatUntil: Date | null;
  location: string | null;
  status: string;
};

const DATES_PREVIEWED = 4;

// UTC getters, not local ones — see the storage convention in src/lib/format.ts.
function toDateInput(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "";
}
function toTimeInput(d: Date | null) {
  return d ? d.toISOString().slice(11, 16) : "";
}
function fromInputs(date: string, time = "") {
  if (!date) return null;
  const value = new Date(`${date}T${time || "00:00"}:00Z`);
  return Number.isNaN(value.getTime()) ? null : value;
}
function shortDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function EventForm({
  event,
  repeatPhrases,
  atCenterLabel,
}: {
  event?: ExistingEvent;
  repeatPhrases: RepeatPhrases;
  atCenterLabel: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(toDateInput(event?.startAt ?? null));
  const [startTime, setStartTime] = useState(
    toTimeInput(event?.startAt ?? null),
  );
  const [endTime, setEndTime] = useState(toTimeInput(event?.endAt ?? null));
  const [repeat, setRepeat] = useState<EventRepeat>(event?.repeat ?? "none");
  const [repeatUntil, setRepeatUntil] = useState(
    toDateInput(event?.repeatUntil ?? null)
  );
  const [location, setLocation] = useState(event?.location ?? CENTER_ADDRESS);
  const [signupUrl, setSignupUrl] = useState(event?.signupUrl ?? "");

  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    event?.flyerUrl ?? null
  );
  const [flyerRemoved, setFlyerRemoved] = useState(false);

  const [busy, setBusy] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const missing = title.trim() ? [] : ["an event title"];

  async function onPickFlyer(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("That file is larger than 10MB. Try exporting a smaller one.");
      return;
    }
    setFlyerFile(file);
    try {
      if (file.type === "application/pdf") {
        const png = await pdfFirstPageToPng(file);
        setPreviewUrl(URL.createObjectURL(png));
      } else {
        setPreviewUrl(URL.createObjectURL(file));
      }
      setFlyerRemoved(false);
    } catch {
      setError(
        "We couldn't read that file. Please try a PDF, JPG, or PNG flyer."
      );
      setFlyerFile(null);
    }
  }

  function removeFlyer() {
    setFlyerFile(null);
    setPreviewUrl(null);
    setFlyerRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadFlyer(): Promise<{
    flyerUrl: string | null;
    flyerDownloadUrl: string | null;
  }> {
    if (!flyerFile) {
      if (flyerRemoved) return { flyerUrl: null, flyerDownloadUrl: null };
      return {
        flyerUrl: event?.flyerUrl ?? null,
        flyerDownloadUrl: event?.flyerDownloadUrl ?? null,
      };
    }
    const opts = { access: "public", handleUploadUrl: "/api/upload" } as const;

    if (flyerFile.type === "application/pdf") {
      const png = await pdfFirstPageToPng(flyerFile);
      const [image, original] = await Promise.all([
        upload("flyers/flyer.png", png, opts),
        upload(`flyers/${flyerFile.name}`, flyerFile, opts),
      ]);
      return { flyerUrl: image.url, flyerDownloadUrl: original.url };
    }

    const image = await upload(`flyers/${flyerFile.name}`, flyerFile, opts);
    return { flyerUrl: image.url, flyerDownloadUrl: image.url };
  }

  async function save(status: "draft" | "published") {
    setError(null);
    if (!title.trim()) {
      setError("Please enter an event title.");
      return;
    }
    setBusy(status);
    try {
      normalizeWebsiteUrl(signupUrl, "sign-up link");
      const flyer = await uploadFlyer();
      const input: EventInput = {
        title,
        description,
        signupUrl,
        date,
        startTime,
        endTime,
        repeat,
        repeatUntil,
        location,
        status,
        ...flyer,
      };
      if (event) {
        await updateEvent(event.id, input);
      } else {
        await createEvent(input);
      }
      router.push("/admin/events");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving the event. Please try again."
      );
      setBusy(null);
    }
  }

  const series: RepeatingEvent = {
    startAt: fromInputs(date, startTime),
    endAt: null,
    repeat,
    repeatUntil: fromInputs(repeatUntil),
  };
  const schedule = describeRepeat(series, repeatPhrases);
  const seriesDates = series.startAt
    ? upcomingOccurrences(series, series.startAt, DATES_PREVIEWED)
    : [];

  const venue = venueLabel(location.trim() || null, atCenterLabel);
  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const timeLabel = startTime
    ? [startTime, endTime]
        .filter(Boolean)
        .map((t) =>
          new Date(`2000-01-01T${t}:00`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        )
        .join(" – ")
    : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <AdminCard>
          <AdminTextField
            size="lg"
            badge={<AdminStep n={1} />}
            label={
              <>
                Event Title <AdminRequired />
              </>
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="Enter event title…"
          />
          <AdminCharacterCount value={title} max={150} />
        </AdminCard>

        <AdminCard>
          <AdminCardHeading step={2} tag={<AdminOptional />}>
            Date &amp; Location
          </AdminCardHeading>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <AdminTextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (!e.target.value) setRepeat("none");
              }}
            />
            <AdminTextField
              label="Starts"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <AdminTextField
              label="Ends"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <AdminSelect
              label="Repeats"
              value={repeat}
              disabled={!date}
              aria-describedby="repeat-hint"
              onChange={(e) => setRepeat(e.target.value as EventRepeat)}
            >
              {REPEAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </AdminSelect>
            {repeat !== "none" && (
              <AdminTextField
                label="Last date (optional)"
                type="date"
                min={date}
                value={repeatUntil}
                onChange={(e) => setRepeatUntil(e.target.value)}
              />
            )}
          </div>
          {!date ? (
            <p id="repeat-hint" className="mt-2 text-xs text-stone">
              Pick a date above to repeat this event every week or every month.
            </p>
          ) : repeat === "none" ? (
            <p id="repeat-hint" className="mt-2 text-xs text-stone">
              For an event that happens again and again — a monthly bingo night,
              a weekly class — set how often it repeats and post it once. The
              website moves it forward to the next date on its own.
            </p>
          ) : (
            <div
              id="repeat-hint"
              className="mt-3 rounded-lg border border-line bg-mist p-4"
            >
              <p className="font-semibold text-ink">{schedule}</p>
              {seriesDates.length > 0 && (
                <p className="mt-1.5 text-sm text-ink-soft">
                  Starting with {seriesDates.map(shortDate).join(", ")}…
                </p>
              )}
              <p className="mt-2 text-xs text-stone">
                Leave the last date blank if the event has no planned end.
                {repeat === "monthly" &&
                  " A monthly event keeps its place in the month — the same weekday, not the same date."}
              </p>
            </div>
          )}

          <div className="mt-4">
            <AdminTextField
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeading step={3} tag={<AdminOptional />}>
            Flyer
          </AdminCardHeading>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Flyer preview"
                className="w-40 rounded-lg border border-line bg-mist object-contain shadow-sm"
              />
            )}
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-40 w-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line p-4 text-center text-sm text-stone hover:border-indigo hover:text-indigo"
              >
                <span className="text-2xl">↑</span>
                {previewUrl ? "Replace flyer" : "Upload flyer"}
                <span className="text-xs">PDF, JPG, or PNG · up to 10MB</span>
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={removeFlyer}
                  className="text-sm font-medium text-indigo-deep hover:underline"
                >
                  Remove flyer
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onPickFlyer(e.target.files?.[0])}
            />
          </div>
          <p className="mt-3 text-xs text-stone">
            No flyer is fine. Without one, the event’s card shows the start of
            the description instead — the preview beside this form shows exactly
            how it will look.
          </p>
        </AdminCard>

        <AdminCard>
          <AdminTextArea
            size="lg"
            badge={<AdminStep n={4} />}
            label={
              <>
                Description <AdminOptional />
              </>
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={8}
            placeholder="Tell people about your event…"
          />
          <AdminCharacterCount value={description} max={1000} />
        </AdminCard>

        <AdminCard>
          <AdminTextField
            size="lg"
            badge={<AdminStep n={5} />}
            label={
              <>
                Sign-up Link <AdminOptional />
              </>
            }
            value={signupUrl}
            onChange={(e) => setSignupUrl(e.target.value)}
            inputMode="url"
            maxLength={500}
            placeholder="e.g. forms.gle/abc123"
          />
          <p className="mt-3 text-sm text-stone">
            The address of a Google Form, an Eventbrite page, or wherever people
            sign up. The event page gets a Sign Up button, and the event is
            marked “Sign-ups open” everywhere it appears.
          </p>
        </AdminCard>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <p className="text-sm font-semibold text-ink">Live Preview</p>
        <p className="mt-1 text-xs text-stone">
          This is how your event will appear on the website.
        </p>
        <div className="surface-card mt-3 flex flex-col rounded-none p-3.5">
          <h3 className="line-clamp-2 font-display text-lg font-semibold text-ink">
            {title || "Your event title"}
          </h3>
          {(dateLabel || timeLabel) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
              {dateLabel && <EventMeta icon="calendar">{dateLabel}</EventMeta>}
              {timeLabel && <EventMeta icon="clock">{timeLabel}</EventMeta>}
            </p>
          )}
          {schedule && (
            <p className="mt-1 text-sm text-stone">
              <EventMeta icon="repeat">{schedule}</EventMeta>
            </p>
          )}
          {previewUrl ? (
            <div className="mt-3 aspect-card w-full overflow-clip bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="h-full w-full scale-95 object-contain"
              />
            </div>
          ) : (
            <EventDescriptionMedia
              description={description.trim() || null}
              className="mt-3"
            />
          )}
          {venue && (
            <p className="mt-3.5 text-sm text-ink-soft">
              <EventMeta icon="pin">{venue}</EventMeta>
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3">
            <span className="font-display text-sm font-semibold text-indigo">
              Details
            </span>
            {signupUrl.trim() && (
              <span className="rounded-md bg-indigo px-3.5 py-2 font-display text-xs font-semibold tracking-[0.08em] text-white uppercase">
                Sign Up
              </span>
            )}
          </div>
        </div>
      </aside>

      <div className="space-y-4 lg:col-span-2">
        {error && <AdminAlert>{error}</AdminAlert>}
        {missing.length > 0 && (
          <AdminRequirements missing={missing} action="save this event" />
        )}
        <AdminFormActions>
          <AdminButton onClick={() => router.push("/admin/events")}>
            Cancel
          </AdminButton>
          <AdminButton disabled={busy !== null} onClick={() => save("draft")}>
            {busy === "draft" ? "Saving…" : "Save Draft"}
          </AdminButton>
          <AdminButton
            variant="primary"
            disabled={busy !== null}
            onClick={() => save("published")}
          >
            {busy === "published" ? "Publishing…" : "Publish Event"}
          </AdminButton>
        </AdminFormActions>
      </div>
    </div>
  );
}
