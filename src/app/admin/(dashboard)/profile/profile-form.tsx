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
import { AdminUserIdentity } from "@/components/admin/admin-user-identity";
import type { UserRole } from "@/db/schema";
import { updateProfileName } from "./actions";

export function ProfileForm({
  currentName,
  email,
  role,
}: {
  currentName: string;
  email: string | null;
  role: UserRole;
}) {
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

  const firstName = name.trim().split(/\s+/)[0] || null;

  return (
    <form onSubmit={save} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
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
          {error && (
            <div className="mt-4">
              <AdminAlert>{error}</AdminAlert>
            </div>
          )}
          <div className="mt-6">
            <AdminFormActions>
              {saved && !error && (
                <p
                  role="status"
                  className="mr-auto text-sm font-medium text-indigo-deep"
                >
                  Saved — you’ll be greeted by name next time you sign in.
                </p>
              )}
              <AdminButton type="submit" variant="primary" disabled={busy}>
                {busy ? "Saving…" : "Save Name"}
              </AdminButton>
            </AdminFormActions>
          </div>
        </AdminCard>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-sm font-semibold text-ink">Preview</p>
        <p className="mt-1 text-xs text-stone">
          This is how you’ll appear in the volunteer portal.
        </p>
        <div className="mt-3 rounded-xl bg-ink p-5 shadow-lg">
          <p className="font-display text-lg text-white">
            {firstName ? (
              <>
                Welcome back,{" "}
                <span className="text-sky">{firstName.toUpperCase()}</span>
              </>
            ) : (
              "Welcome back"
            )}
          </p>
          <div className="mt-4 border-t border-white/15 pt-4">
            <AdminUserIdentity user={{ name, email, role }} />
          </div>
        </div>
      </aside>
    </form>
  );
}
