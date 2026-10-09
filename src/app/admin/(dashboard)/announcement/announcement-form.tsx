"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import { AdminCard, AdminCardHeading } from "@/components/admin/admin-card";
import { AdminCharacterCount, AdminOptional, AdminTextField } from "@/components/admin/admin-field";
import { updateAnnouncement } from "../settings/actions";

const TEXT_MAX = 140;

type AnnouncementFormValues = {
  text: string;
  textJa: string;
  url: string;
  until: string;
};

function AnnouncementPreview({ text, hasLink }: { text: string; hasLink: boolean }) {
  return (
    <div className="mb-6 overflow-clip rounded-lg bg-navy">
      <div className="flex items-center gap-3 px-5 py-2.5">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3">
          <span className="shrink-0 font-accent text-sm font-bold tracking-[0.1em] text-sky">
            お知らせ
          </span>
          <span className="hidden shrink-0 font-display text-[11px] font-bold tracking-[0.18em] text-sky uppercase sm:inline">
            Notice
          </span>
          <span className="min-w-0 truncate text-xs text-white/85">
            {text || "Your message appears here"}
          </span>
          {hasLink && (
            <span className="shrink-0 font-display text-xs font-bold text-blossom underline-offset-4">
              Learn more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnnouncementForm({
  initialAnnouncement,
}: {
  initialAnnouncement: AnnouncementFormValues;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialAnnouncement.text);
  const [textJa, setTextJa] = useState(initialAnnouncement.textJa);
  const [url, setUrl] = useState(initialAnnouncement.url);
  const [until, setUntil] = useState(initialAnnouncement.until);
  const [busy, setBusy] = useState<"save" | "clear" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState("");

  async function submit(values: AnnouncementFormValues, kind: "save" | "clear") {
    if (busy) return;
    setError(null);
    setSaved("");
    setBusy(kind);
    try {
      await updateAnnouncement(values);
      if (kind === "clear" || !values.text.trim()) {
        setText("");
        setTextJa("");
        setUrl("");
        setUntil("");
        setSaved("Saved — the bar now shows the next event.");
      } else {
        setSaved("Saved — the announcement is now showing on every page.");
      }
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving the announcement. Please try again."
      );
    } finally {
      setBusy(null);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit({ text, textJa, url, until }, "save");
  }

  function clearAnnouncement() {
    submit({ text: "", textJa: "", url: "", until: "" }, "clear");
  }

  return (
    <form onSubmit={save}>
      <AdminCardHeading>Preview</AdminCardHeading>
      <div className="mt-3">
        <AnnouncementPreview text={text} hasLink={url.trim().length > 0} />
      </div>

      <AdminCard>
        <div className="flex flex-col gap-5">
          <div>
            <AdminTextField
              label="Message (English)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={TEXT_MAX}
              autoComplete="off"
            />
            <AdminCharacterCount value={text} max={TEXT_MAX} />
          </div>

          <div>
            <AdminTextField
              label={
                <>
                  Message (Japanese) <AdminOptional />
                </>
              }
              value={textJa}
              onChange={(e) => setTextJa(e.target.value)}
              maxLength={TEXT_MAX}
              autoComplete="off"
            />
          </div>

          <div>
            <AdminTextField
              label={
                <>
                  Link <AdminOptional />
                </>
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={500}
              autoComplete="off"
            />
            <p className="mt-1.5 text-sm text-stone">
              A web page or email address for people who want more.
            </p>
          </div>

          <div>
            <AdminTextField
              label={
                <>
                  Show until <AdminOptional />
                </>
              }
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mt-5">
            <AdminAlert>{error}</AdminAlert>
          </div>
        )}
        <p
          role="status"
          aria-live="polite"
          className="mt-5 text-sm font-medium text-indigo-deep empty:mt-0"
        >
          {saved}
        </p>

        <div className="mt-6">
          <AdminFormActions>
            <AdminButton
              type="button"
              variant="secondary"
              disabled={busy !== null}
              onClick={clearAnnouncement}
            >
              {busy === "clear" ? "Clearing…" : "Clear the announcement"}
            </AdminButton>
            <AdminButton type="submit" variant="primary" disabled={busy !== null}>
              {busy === "save" ? "Saving…" : "Save"}
            </AdminButton>
          </AdminFormActions>
        </div>
      </AdminCard>
    </form>
  );
}
