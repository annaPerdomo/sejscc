"use client";

import { useState, useSyncExternalStore } from "react";
import { AdminAlert } from "@/components/admin/admin-alert";
import { buttonClass } from "@/components/admin/admin-button";
import { focusByKey } from "./open-target";

const STORAGE_KEY = "sejscc-admin-board-hint-dismissed";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return true;
}

export function FirstVisitHint() {
  const storedDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissedNow, setDismissedNow] = useState(false);

  function dismiss() {
    setDismissedNow(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setTimeout(() => focusByKey("lang-en"), 0);
  }

  if (storedDismissed || dismissedNow) return null;

  return (
    <div className="mb-5">
      <AdminAlert role="note">
        <span className="block">
          <strong className="font-semibold">How to edit:</strong> click any
          words to change them. Use <strong className="font-semibold">Options</strong> on
          a name or a way to help to move it, hide it, or remove it. Each
          change goes live as soon as you save it, and you can undo the last
          one.
        </span>
        <button
          type="button"
          onClick={dismiss}
          className={`mt-3 min-h-11 ${buttonClass("secondary")}`}
        >
          Got it
        </button>
      </AdminAlert>
    </div>
  );
}
