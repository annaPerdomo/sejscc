"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { EventRepeat } from "@/db/schema";
import { expectOk } from "@/lib/action-result";
import { CENTER_ADDRESS, venueLabel } from "@/lib/center";
import { composeFlyer, NO_FLYER_STYLE, type FlyerStyle, type FlyerLettering } from "@/lib/flyer-compose";
import type { FlyerLayout } from "@/lib/flyer-layouts";
import { EVENT_TITLE_MAX_LENGTH } from "@/lib/flyer-art";
import { formatShortEventDate, normalizeWebsiteUrl } from "@/lib/format";
import { pdfFirstPageToPng } from "@/lib/pdf-preview";
import { MAX_UPLOAD_BYTES, PHOTO_UNREADABLE_MESSAGE, asUploadablePhoto } from "@/lib/photo-upload";
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
import { AdminOptionTile } from "@/components/admin/admin-option-tile";
import { EventDescriptionMedia } from "@/components/event-media";
import { EventMeta } from "@/components/event-meta";
import { createEvent, updateEvent, type EventInput } from "./actions";
import { FlyerMaker } from "./flyer-maker";

const REPEAT_OPTIONS: { value: EventRepeat; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every other week" },
  { value: "monthly", label: "Every month" },
];

type FlyerChoice = "make" | "upload" | "none";

const FLYER_CHOICES: { value: FlyerChoice; name: string; blurb: string }[] = [
  { value: "make", name: "Make one here", blurb: "Pick a picture. The title, date and place are printed on it for you." },
  { value: "upload", name: "Upload my own", blurb: "A flyer you already have, as a PDF or a photo." },
  { value: "none", name: "No flyer", blurb: "The event shows its description instead." },
];

type ExistingEvent = {
  id: string;
  title: string;
  description: string | null;
  flyerUrl: string | null;
  flyerDownloadUrl: string | null;
  flyerArtUrl: string | null;
  flyerLayout: FlyerLayout | null;
  flyerWordsX: number | null;
  flyerWordsY: number | null;
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
function flyerDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
function flyerLettering({
  title,
  date,
  repeat,
  schedule,
  timeLabel,
  venue,
}: {
  title: string;
  date: string;
  repeat: EventRepeat;
  schedule: string | null;
  timeLabel: string | null;
  venue: string | null;
}): FlyerLettering {
  const day = repeat === "none" ? date && flyerDate(date) : schedule;
  const first = repeat === "none" ? fromInputs(date) : null;
  return {
    title: title.trim(),
    kicker: date && repeat === "none" ? formatShortEventDate(fromInputs(date), "ja") : null,
    when: [day, timeLabel].filter(Boolean).join(" · ") || null,
    where: venue,
    badge: first
      ? {
          month: first.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
          day: String(first.getUTCDate()),
        }
      : null,
  };
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
  const letteredUrlRef = useRef<string | null>(null);
  const uploadPreviewRef = useRef<string | null>(null);

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

  const savedUploadUrl = event?.flyerUrl && !event.flyerArtUrl ? event.flyerUrl : null;
  const [flyerChoice, setFlyerChoice] = useState<FlyerChoice>(
    event?.flyerArtUrl ? "make" : event?.flyerUrl ? "upload" : "none"
  );
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(savedUploadUrl);
  const [artUrl, setArtUrl] = useState(event?.flyerArtUrl ?? null);
  const [letteredUrl, setLetteredUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<FlyerStyle>({
    layout: event?.flyerLayout ?? null,
    wordsX: event?.flyerWordsX ?? null,
    wordsY: event?.flyerWordsY ?? null,
  });

  const [busy, setBusy] = useState<"draft" | "published" | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missing = [
    !title.trim() && "an event title",
    flyerChoice === "make" && !artUrl && "a picture for the flyer",
    flyerChoice === "upload" && !flyerFile && !savedUploadUrl && "a flyer file",
  ].filter((item) => typeof item === "string");

  async function onPickFlyer(picked: File | undefined) {
    setError(null);
    if (!picked || preparing) return;
    const isPdf = picked.type === "application/pdf";
    if (isPdf && picked.size > MAX_UPLOAD_BYTES) {
      setError("That PDF is larger than 10 MB. Try saving a smaller one, or use a photo of the flyer.");
      return;
    }
    setPreparing(true);
    try {
      await prepareFlyer(isPdf ? picked : await asUploadablePhoto(picked));
    } finally {
      setPreparing(false);
    }
  }

  async function prepareFlyer(file: File | null) {
    if (!file) {
      setError(PHOTO_UNREADABLE_MESSAGE);
      return;
    }
    setFlyerFile(file);
    try {
      const image = file.type === "application/pdf" ? await pdfFirstPageToPng(file) : file;
      const url = URL.createObjectURL(image);
      if (uploadPreviewRef.current) URL.revokeObjectURL(uploadPreviewRef.current);
      uploadPreviewRef.current = url;
      setUploadPreviewUrl(url);
    } catch {
      setError(
        "We couldn't read that file. Please try a PDF, JPG, or PNG flyer."
      );
      setFlyerFile(null);
    }
  }

  function chooseArt(chosen: string, preview: string) {
    setArtUrl(chosen);
    setLetteredUrl(preview);
    setStyle(NO_FLYER_STYLE);
  }

  async function uploadFlyer(): Promise<{
    flyerUrl: string | null;
    flyerDownloadUrl: string | null;
    flyerArtUrl: string | null;
  }> {
    const opts = { access: "public", handleUploadUrl: "/api/upload" } as const;

    if (flyerChoice === "none") {
      return { flyerUrl: null, flyerDownloadUrl: null, flyerArtUrl: null };
    }

    if (flyerChoice === "make") {
      if (artUrl && needsLettering) {
        const flyer = await composeFlyer(artUrl, lettering, style);
        const image = await upload("flyers/flyer.jpg", flyer, opts);
        return { flyerUrl: image.url, flyerDownloadUrl: image.url, flyerArtUrl: artUrl };
      }
      return {
        flyerUrl: event?.flyerUrl ?? null,
        flyerDownloadUrl: event?.flyerDownloadUrl ?? null,
        flyerArtUrl: event?.flyerArtUrl ?? null,
      };
    }

    if (!flyerFile) {
      return {
        flyerUrl: savedUploadUrl,
        flyerDownloadUrl: savedUploadUrl && (event?.flyerDownloadUrl ?? null),
        flyerArtUrl: null,
      };
    }

    if (flyerFile.type === "application/pdf") {
      const png = await pdfFirstPageToPng(flyerFile);
      const [image, original] = await Promise.all([
        upload("flyers/flyer.png", png, opts),
        upload(`flyers/${flyerFile.name}`, flyerFile, opts),
      ]);
      return { flyerUrl: image.url, flyerDownloadUrl: original.url, flyerArtUrl: null };
    }

    const image = await upload(`flyers/${flyerFile.name}`, flyerFile, opts);
    return { flyerUrl: image.url, flyerDownloadUrl: image.url, flyerArtUrl: null };
  }

  async function save(status: "draft" | "published") {
    if (busy !== null || preparing) return;
    setError(null);
    if (!title.trim()) {
      setError("Please enter an event title.");
      return;
    }
    if (flyerChoice === "make" && !artUrl) {
      setError("Pick a picture for the flyer, or choose “No flyer”.");
      return;
    }
    if (flyerChoice === "upload" && !flyerFile && !savedUploadUrl) {
      setError("Choose the flyer file to upload, or choose “No flyer”.");
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
        flyerLayout: style.layout,
        flyerWordsX: style.wordsX,
        flyerWordsY: style.wordsY,
        ...flyer,
      };
      if (event) {
        expectOk(await updateEvent(event.id, input));
      } else {
        expectOk(await createEvent(input));
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

  const lettering = flyerLettering({ title, date, repeat, schedule, timeLabel, venue });
  const letteringKey = JSON.stringify({ lettering, style });
  const [savedLetteringKey] = useState(letteringKey);
  const needsLettering =
    artUrl !== (event?.flyerArtUrl ?? null) || letteringKey !== savedLetteringKey;
  const previewKey = `${artUrl}|${letteringKey}`;
  const [letteredKey, setLetteredKey] = useState<string | null>(null);

  useEffect(() => {
    if (flyerChoice !== "make" || !artUrl || !needsLettering) return;
    let current = true;
    const timer = setTimeout(async () => {
      try {
        const flyer = await composeFlyer(
          artUrl,
          flyerLettering({ title, date, repeat, schedule, timeLabel, venue }),
          style
        );
        if (!current) return;
        const url = URL.createObjectURL(flyer);
        if (letteredUrlRef.current) URL.revokeObjectURL(letteredUrlRef.current);
        letteredUrlRef.current = url;
        setLetteredUrl(url);
        setLetteredKey(previewKey);
      } catch {
        if (!current) return;
        setLetteredKey(previewKey);
        setError("The flyer picture couldn’t be drawn. Try choosing another picture.");
      }
    }, 400);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [flyerChoice, artUrl, needsLettering, title, date, repeat, schedule, timeLabel, venue, style, previewKey]);

  useEffect(
    () => () => {
      if (letteredUrlRef.current) URL.revokeObjectURL(letteredUrlRef.current);
      if (uploadPreviewRef.current) URL.revokeObjectURL(uploadPreviewRef.current);
    },
    []
  );

  const madePreviewUrl =
    artUrl && artUrl === event?.flyerArtUrl && !needsLettering
      ? event.flyerUrl
      : letteredUrl;
  const shownPreviewUrl =
    flyerChoice === "make" ? madePreviewUrl : flyerChoice === "upload" ? uploadPreviewUrl : null;

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
            maxLength={EVENT_TITLE_MAX_LENGTH}
            placeholder="Enter event title…"
          />
          <AdminCharacterCount value={title} max={EVENT_TITLE_MAX_LENGTH} />
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
          <fieldset className="mt-4">
            <legend className="text-base font-semibold text-ink">
              Does this event have a flyer?
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {FLYER_CHOICES.map((choice) => (
                <AdminOptionTile
                  key={choice.value}
                  inputName="flyer-choice"
                  name={choice.name}
                  blurb={choice.blurb}
                  checked={flyerChoice === choice.value}
                  onSelect={() => setFlyerChoice(choice.value)}
                />
              ))}
            </div>
          </fieldset>

          {flyerChoice === "upload" && (
            <div className="mt-6 flex flex-wrap items-start gap-5">
              {uploadPreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={uploadPreviewUrl}
                  alt="Your flyer"
                  className="w-48 rounded-lg border border-line bg-mist object-contain shadow-sm"
                />
              )}
              <div>
                <AdminButton
                  variant="primary"
                  aria-disabled={preparing}
                  onClick={() => {
                    if (!preparing) fileInputRef.current?.click();
                  }}
                >
                  {preparing
                    ? "Getting your flyer ready…"
                    : uploadPreviewUrl
                      ? "Choose a different file"
                      : "Choose the flyer file"}
                </AdminButton>
                <p className="mt-2 text-sm text-stone">
                  A PDF up to 10 MB, or a JPG or PNG photo of any size.
                </p>
                <p role="status" className="sr-only">
                  {preparing ? "Getting your flyer ready…" : ""}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onPickFlyer(e.target.files?.[0])}
              />
            </div>
          )}

          <div hidden={flyerChoice !== "make"}>
            <FlyerMaker
              active={flyerChoice === "make"}
              request={{ title, description, date }}
              lettering={lettering}
              artUrl={artUrl}
              style={style}
              previewUrl={madePreviewUrl}
              updating={needsLettering && letteredKey !== previewKey}
              onChoose={chooseArt}
              onStyleChange={setStyle}
            />
          </div>

          {flyerChoice === "none" && (
            <p className="mt-4 text-sm text-stone">
              That’s fine. The event’s card shows the start of the description
              instead. The Live Preview shows exactly how it will look.
            </p>
          )}
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
          {shownPreviewUrl ? (
            <div className="mt-3 aspect-card w-full overflow-clip bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shownPreviewUrl}
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
          <AdminButton
            aria-disabled={busy !== null || preparing}
            onClick={() => save("draft")}
          >
            {busy === "draft" ? "Saving…" : "Save Draft"}
          </AdminButton>
          <AdminButton
            variant="primary"
            aria-disabled={busy !== null || preparing}
            onClick={() => save("published")}
          >
            {busy === "published" ? "Publishing…" : "Publish Event"}
          </AdminButton>
        </AdminFormActions>
      </div>
    </div>
  );
}
