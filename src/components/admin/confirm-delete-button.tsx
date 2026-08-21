"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "./admin-alert";

export function ConfirmDeleteButton({
  action,
  label,
  prompt,
  redirectTo,
}: {
  action: () => Promise<void>;
  label: string;
  prompt: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      await action();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("We couldn’t delete this just now. Please try again.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-indigo-deep hover:bg-indigo/5"
      >
        {label}
      </button>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo/40 bg-indigo/5 p-2">
        <span className="px-2 text-sm font-medium text-indigo-deep">
          {prompt}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={confirm}
          className="rounded-md bg-indigo px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-deep disabled:opacity-50"
        >
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(false)}
          className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-white"
        >
          Keep it
        </button>
      </div>
      {error && (
        <div className="mt-2">
          <AdminAlert>{error}</AdminAlert>
        </div>
      )}
    </div>
  );
}
