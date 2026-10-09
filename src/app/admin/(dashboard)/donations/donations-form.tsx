"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTextField } from "@/components/admin/admin-field";
import { ZELLE_FALLBACK_EMAIL } from "@/lib/donate";
import { updateDonationDetails } from "../settings/actions";

type DonationFormValues = {
  zelleRecipient: string;
  checkPayee: string;
  checkAddress: string;
  donateFormUrl: string;
};

export function DonationDetailsForm({
  initialDonation,
}: {
  initialDonation: DonationFormValues;
}) {
  const router = useRouter();
  const [zelleRecipient, setZelleRecipient] = useState(
    initialDonation.zelleRecipient
  );
  const [checkPayee, setCheckPayee] = useState(initialDonation.checkPayee);
  const [checkAddress, setCheckAddress] = useState(
    initialDonation.checkAddress
  );
  const [donateFormUrl, setDonateFormUrl] = useState(
    initialDonation.donateFormUrl
  );
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
      await updateDonationDetails({
        zelleRecipient,
        checkPayee,
        checkAddress,
        donateFormUrl,
      });
      setSaved("Saved — the donation page now shows these details.");
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
          <div>
            <AdminTextField
              label="Zelle name or email"
              value={zelleRecipient}
              onChange={(e) => setZelleRecipient(e.target.value)}
              maxLength={120}
              autoComplete="off"
            />
            <p className="mt-1.5 text-sm text-stone">
              Leave empty to tell visitors to email {ZELLE_FALLBACK_EMAIL} for
              Zelle details.
            </p>
          </div>

          <div>
            <AdminTextField
              label="Checks payable to"
              value={checkPayee}
              onChange={(e) => setCheckPayee(e.target.value)}
              maxLength={120}
              autoComplete="off"
            />
            <p className="mt-1.5 text-sm text-stone">
              Leave empty to use SEJSCC.
            </p>
          </div>

          <div>
            <AdminTextField
              label="Mailing address for checks"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              maxLength={200}
              autoComplete="off"
            />
            <p className="mt-1.5 text-sm text-stone">
              Leave empty to use the center&apos;s address.
            </p>
          </div>

          <div>
            <AdminTextField
              label="Donation form link"
              type="url"
              value={donateFormUrl}
              onChange={(e) => setDonateFormUrl(e.target.value)}
              maxLength={500}
              autoComplete="off"
            />
            <p className="mt-1.5 text-sm text-stone">
              The embed link from Zeffy. Leave empty to keep the current
              form.
            </p>
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
            <AdminButton type="submit" variant="primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </AdminButton>
          </AdminFormActions>
        </div>
      </AdminCard>
    </form>
  );
}
