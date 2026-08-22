"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTextField } from "@/components/admin/admin-field";
import { updateAccessRequestEmail } from "./actions";

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
