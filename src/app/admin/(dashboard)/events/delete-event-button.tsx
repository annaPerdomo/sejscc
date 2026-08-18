"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "./actions";

export function DeleteEventButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-indigo-deep hover:bg-indigo/5"
      >
        Delete event
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-indigo/40 bg-indigo/5 p-2">
      <span className="px-2 text-sm font-medium text-indigo-deep">
        Delete this event for good?
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await deleteEvent(id);
            router.push("/admin");
            router.refresh();
          } catch {
            setBusy(false);
            setConfirming(false);
          }
        }}
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
  );
}
