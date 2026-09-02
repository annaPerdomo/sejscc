"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTextArea, AdminTextField } from "@/components/admin/admin-field";
import { updateAboutVideoUrls, updateAccessRequestEmail } from "./actions";

export function AccessRequestEmailForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setSaved("");
    setBusy(true);
    try {
      const stored = await updateAccessRequestEmail(email);
      setEmail(stored ?? "");
      setSaved(
        stored
          ? `Saved — people who can't sign in will be told to email ${stored}.`
          : "Saved — the sign-in page will no longer show an address to contact."
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving that address. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <AdminTextField
              label="Email address for access requests"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@sejscc.org"
              maxLength={254}
              autoComplete="off"
            />
          </div>
          <AdminButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Shown to anyone who tries to sign in without access. Leave it blank
          to show no address at all.
        </p>
        {error && (
          <div className="mt-3">
            <AdminAlert>{error}</AdminAlert>
          </div>
        )}
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-sm font-medium text-indigo-deep empty:mt-0"
        >
          {saved}
        </p>
      </AdminCard>
    </form>
  );
}

export function AboutVideoForm({ initialUrls }: { initialUrls: string[] }) {
  const router = useRouter();
  const [text, setText] = useState(initialUrls.join("\n"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setSaved("");
    setBusy(true);
    try {
      const stored = await updateAboutVideoUrls(text);
      setText(stored.join("\n"));
      setSaved(
        stored.length > 0
          ? `Saved — ${stored.length === 1 ? "the video" : `${stored.length} videos`} now ${
              stored.length === 1 ? "plays" : "play"
            } on the home page.`
          : "Saved — the home page no longer shows any videos."
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving those links. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <AdminCard>
        <AdminTextArea
          label="Featured YouTube videos for the home page"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=..."}
          rows={4}
          maxLength={4096}
          autoComplete="off"
        />
        <p className="mt-3 text-sm leading-relaxed text-stone">
          One link per line, up to 6 videos. They play in the &ldquo;Our
          History&rdquo; section of the home page, in the order listed here.
          Leave blank to show no videos.
        </p>
        <div className="mt-4">
          <AdminButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </div>
        {error && (
          <div className="mt-3">
            <AdminAlert>{error}</AdminAlert>
          </div>
        )}
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-sm font-medium text-indigo-deep empty:mt-0"
        >
          {saved}
        </p>
      </AdminCard>
    </form>
  );
}
