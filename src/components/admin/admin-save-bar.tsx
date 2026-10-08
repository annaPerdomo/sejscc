"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass } from "@/components/admin/admin-button";

export function AdminSaveBar({
  dirty,
  saving,
  status,
  error,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  status: string | null;
  error: string | null;
  onSave: () => void;
  onDiscard: () => void;
}) {
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  if (!dirty && !status && !error) return null;

  return (
    <div className="sticky bottom-0 z-10 border-t border-white/10 bg-navy px-4 pt-4 pb-safe-bottom text-white sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div aria-live="polite" className="min-w-0 flex-1 text-sm">
          {error ? (
            <p role="alert" className="font-medium text-blossom">
              {error}
            </p>
          ) : dirty ? (
            <p className="font-medium text-sky">You have unsaved changes</p>
          ) : status ? (
            <p className="font-medium text-sky">
              {status}{" "}
              <Link href="/#board" className="underline hover:text-white">
                View it
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-3">
          {dirty && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className={`min-h-12 ${buttonClass("on-dark")}`}
            >
              Discard changes
            </button>
          )}
          {dirty && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`min-h-12 ${buttonClass("primary")}`}
            >
              {saving ? "Saving…" : "Save and publish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
