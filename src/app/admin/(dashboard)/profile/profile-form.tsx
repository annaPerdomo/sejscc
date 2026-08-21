"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import {
  AdminCharacterCount,
  AdminTextField,
} from "@/components/admin/admin-field";
import { updateProfileName } from "./actions";

export function ProfileForm({ currentName }: { currentName: string }) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setBusy(true);
    try {
      await updateProfileName(name);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving your name. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-6">
      <AdminCard>
        <AdminTextField
          size="lg"
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="e.g. Anna Perdomo"
          autoComplete="name"
        />
        <AdminCharacterCount value={name} max={100} />
      </AdminCard>

      <div className="space-y-4">
        {error && <AdminAlert>{error}</AdminAlert>}
        {saved && !error && (
          <p role="status" className="text-sm font-medium text-indigo-deep">
            Saved — you’ll be greeted by name next time you sign in.
          </p>
        )}
        <AdminFormActions>
          <AdminButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Saving…" : "Save Name"}
          </AdminButton>
        </AdminFormActions>
      </div>
    </form>
  );
}
