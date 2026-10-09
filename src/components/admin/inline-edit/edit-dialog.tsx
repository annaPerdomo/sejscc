"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function EditDialog({
  title,
  open,
  busy = false,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function requestClose() {
    if (busy) return;
    onClose();
  }

  return (
    <dialog
      ref={ref}
      className="edit-dialog"
      aria-label={title}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            aria-disabled={busy}
            className="min-h-11 min-w-11 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-mist aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </dialog>
  );
}
