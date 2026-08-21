"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTextField } from "@/components/admin/admin-field";
import { addAllowedEmail } from "./actions";

export function AddVolunteerForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState("");

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setAdded("");
    setBusy(true);
    try {
      const result = await addAllowedEmail(email);
      setAdded(
        result.alreadyListed
          ? `${result.email} was already on the list.`
          : `Added — ${result.email} can now sign in with a link sent to their email.`
      );
      setEmail("");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong adding that email. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={add}>
      <AdminCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <AdminTextField
              label="Add a volunteer by email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.org"
              maxLength={254}
              autoComplete="off"
              required
            />
          </div>
          <AdminButton type="submit" variant="primary" disabled={busy}>
            {busy ? "Adding…" : "Add"}
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
          {added}
        </p>
      </AdminCard>
    </form>
  );
}
