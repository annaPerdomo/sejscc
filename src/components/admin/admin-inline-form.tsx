"use client";

import type { ReactNode } from "react";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButton, AdminFormActions } from "@/components/admin/admin-button";

export function AdminInlineForm({
  onCancel,
  onSubmit,
  busy,
  error,
  saveLabel = "Save",
  children,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  saveLabel?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="space-y-5 p-4"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) onCancel();
      }}
    >
      {children}
      {error && <AdminAlert>{error}</AdminAlert>}
      <AdminFormActions>
        <AdminButton type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </AdminButton>
        <AdminButton
          type="button"
          variant="primary"
          onClick={onSubmit}
          disabled={busy}
        >
          {busy ? "Saving…" : saveLabel}
        </AdminButton>
      </AdminFormActions>
    </div>
  );
}
