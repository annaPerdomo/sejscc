"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import { AdminCharacterCount, AdminOptional, AdminTextField } from "@/components/admin/admin-field";
import { expectOk } from "@/lib/action-result";
import en from "@/dictionaries/en.json";
import { updateAnnouncement } from "../settings/actions";

const TEXT_MAX = 140;
const LINK_LABEL_MAX = 30;
const DEFAULT_LINK_LABEL = en.header.noticeCta;

type AnnouncementFormValues = {
  text: string;
  textJa: string;
  url: string;
  linkLabel: string;
  until: string;
};

type NextEventSummary = { title: string; date: string | null; hasSignup: boolean };

export type BannerMode = "next-event" | "message";

const EMPTY_VALUES: AnnouncementFormValues = { text: "", textJa: "", url: "", linkLabel: "", until: "" };

function BannerPreview({
  accent,
  label,
  text,
  link,
}: {
  accent: string;
  label: string;
  text: string;
  link?: string;
}) {
  return (
    <div className="overflow-clip rounded-lg bg-navy">
      <div className="flex items-center justify-center gap-2 px-5 py-2.5 sm:gap-3">
        <span lang="ja" className="shrink-0 font-accent text-sm font-bold tracking-[0.1em] text-sky">
          {accent}
        </span>
        <span className="hidden shrink-0 font-display text-xs font-bold tracking-[0.18em] text-sky uppercase sm:inline">
          {label}
        </span>
        <span className="min-w-0 truncate text-sm text-white/85">{text}</span>
        {link && (
          <span className="shrink-0 font-display text-sm font-bold text-blossom">{link}</span>
        )}
      </div>
    </div>
  );
}

function ModeChoice({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  children,
}: {
  name: string;
  value: BannerMode;
  checked: boolean;
  onChange: (mode: BannerMode) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div
      className={`rounded-xl border-2 p-5 ${
        checked ? "border-indigo bg-white" : "border-line bg-white/60"
      }`}
    >
      <div className="flex items-start gap-4">
        <input
          id={id}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="mt-1.5 h-5 w-5 shrink-0 accent-indigo"
        />
        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
          <span className="block font-display text-xl text-ink">{title}</span>
          <span className="mt-1 block text-base text-ink-soft">{description}</span>
        </label>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function AnnouncementForm({
  nextEvent,
  initialMode,
  initialAnnouncement,
}: {
  nextEvent: NextEventSummary | null;
  initialMode: BannerMode;
  initialAnnouncement: AnnouncementFormValues;
}) {
  const router = useRouter();
  const modeName = useId();
  const [mode, setMode] = useState<BannerMode>(initialMode);
  const [text, setText] = useState(initialAnnouncement.text);
  const [textJa, setTextJa] = useState(initialAnnouncement.textJa);
  const [url, setUrl] = useState(initialAnnouncement.url);
  const [linkLabel, setLinkLabel] = useState(initialAnnouncement.linkLabel);
  const [until, setUntil] = useState(initialAnnouncement.until);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState("");

  const hasLink = url.trim().length > 0;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (mode === "message" && !text.trim()) {
      setError("Write the message you'd like the banner to show, or choose the next event instead.");
      return;
    }
    setError(null);
    setSaved("");
    setBusy(true);
    try {
      const values = mode === "message" ? { text, textJa, url, linkLabel, until } : EMPTY_VALUES;
      expectOk(await updateAnnouncement(values));
      if (mode === "next-event") {
        setText("");
        setTextJa("");
        setUrl("");
        setLinkLabel("");
        setUntil("");
      }
      setSaved(
        mode === "message"
          ? "Saved — your message is now at the top of every page."
          : "Saved — the banner now points to the next event on its own."
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving the banner. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 font-display text-xl text-ink">What should the banner show?</legend>

        <ModeChoice
          name={modeName}
          value="next-event"
          checked={mode === "next-event"}
          onChange={setMode}
          title="The next event"
          description="Updates by itself as events come and go. Nothing to remember."
        >
          {nextEvent ? (
            <BannerPreview
              accent="次回"
              label="Next up"
              text={nextEvent.date ? `${nextEvent.title} · ${nextEvent.date}` : nextEvent.title}
              link={nextEvent.hasSignup ? "Sign up" : "See details"}
            />
          ) : (
            <p className="text-base text-ink-soft">
              No events are coming up right now, so the bar stays empty until one is added.
            </p>
          )}
        </ModeChoice>

        <ModeChoice
          name={modeName}
          value="message"
          checked={mode === "message"}
          onChange={setMode}
          title="A message you write"
          description="For a closure, a reminder or anything the whole community should see first."
        >
          <BannerPreview
            accent="お知らせ"
            label="Notice"
            text={text.trim() || "Your message appears here"}
            link={hasLink ? linkLabel.trim() || DEFAULT_LINK_LABEL : undefined}
          />
          {mode === "message" && (
            <div className="mt-5 flex flex-col gap-5">
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

              {hasLink && (
                <div>
                  <AdminTextField
                    label={
                      <>
                        Words on the link <AdminOptional />
                      </>
                    }
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    maxLength={LINK_LABEL_MAX}
                    placeholder={DEFAULT_LINK_LABEL}
                    autoComplete="off"
                  />
                  <p className="mt-1.5 text-sm text-stone">
                    For example “Sign up”, “Read the letter” or “Email us”. The
                    Japanese site always says 詳しく見る.
                  </p>
                </div>
              )}

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
                <p className="mt-1.5 text-sm text-stone">
                  After this day the banner goes back to showing the next event.
                </p>
              </div>
            </div>
          )}
        </ModeChoice>
      </fieldset>

      <div className="mt-6">
        {error && (
          <div className="mb-5">
            <AdminAlert>{error}</AdminAlert>
          </div>
        )}
        <p
          role="status"
          aria-live="polite"
          className="mb-5 text-base font-medium text-indigo-deep empty:hidden"
        >
          {saved}
        </p>
        <AdminFormActions>
          <AdminButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </AdminFormActions>
      </div>
    </form>
  );
}
