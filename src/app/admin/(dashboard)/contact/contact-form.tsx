"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTextField } from "@/components/admin/admin-field";
import type { CenterContact } from "@/lib/site-settings";
import { updateContactDetails } from "../settings/actions";

export function ContactDetailsForm({
  initialContact,
}: {
  initialContact: CenterContact;
}) {
  const router = useRouter();
  const [address, setAddress] = useState(initialContact.address);
  const [phone, setPhone] = useState(initialContact.phone);
  const [email, setEmail] = useState(initialContact.email);
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
      await updateContactDetails({ address, phone, email });
      setSaved("Saved — the website now shows these contact details.");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving these details. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <AdminCard>
        <div className="flex flex-col gap-5">
          <AdminTextField
            label="Street address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={200}
            autoComplete="off"
            required
          />
          <AdminTextField
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={40}
            autoComplete="off"
            required
          />
          <AdminTextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="off"
            required
          />
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
            <AdminButton type="submit" variant="primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </AdminButton>
          </AdminFormActions>
        </div>
      </AdminCard>
    </form>
  );
}
