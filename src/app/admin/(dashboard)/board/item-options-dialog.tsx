"use client";

import type { ReactNode } from "react";
import { buttonClass } from "@/components/admin/admin-button";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { EditDialog } from "@/components/admin/inline-edit/edit-dialog";

const OPTION_BUTTON_CLASS =
  "flex min-h-14 w-full items-center gap-3 rounded-lg border border-line bg-white px-4 text-left text-base font-semibold text-ink hover:bg-mist aria-disabled:cursor-not-allowed aria-disabled:bg-mist aria-disabled:text-stone";

function OptionButton({
  onClick,
  disabled,
  focusKey,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  focusKey?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      aria-disabled={disabled}
      data-focus-key={focusKey}
      className={OPTION_BUTTON_CLASS}
    >
      {children}
    </button>
  );
}

export function MemberPanel({
  open,
  onClose,
  busy = false,
  memberName,
  index,
  total,
  moveBusy,
  onMove,
  visible,
  visibleBusy,
  onToggleVisible,
  onRemove,
  photo,
  children,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  memberName: string;
  index: number;
  total: number;
  moveBusy: boolean;
  onMove: (direction: "up" | "down") => void;
  visible: boolean;
  visibleBusy: boolean;
  onToggleVisible: () => void;
  onRemove: () => Promise<void>;
  photo?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <EditDialog title={memberName} open={open} busy={busy} onClose={onClose}>
      <div className="space-y-6">
        {children}

        <div className="space-y-4 border-t border-line pt-4">
          {index > 0 && (
            <OptionButton
              onClick={() => onMove("up")}
              disabled={moveBusy}
              focusKey="member-dialog-move-up"
            >
              Move up<span className="sr-only"> {memberName}</span>
            </OptionButton>
          )}
          {index < total - 1 && (
            <OptionButton
              onClick={() => onMove("down")}
              disabled={moveBusy}
              focusKey="member-dialog-move-down"
            >
              Move down<span className="sr-only"> {memberName}</span>
            </OptionButton>
          )}

          <div>
            <OptionButton
              onClick={onToggleVisible}
              disabled={visibleBusy}
              focusKey="member-dialog-visibility"
            >
              {visible ? "Hide from website" : "Show on website"}
            </OptionButton>
            <p className="mt-1 text-sm text-stone">
              Hidden members stay here so you can show them again later.
            </p>
          </div>
        </div>

        {photo && <div className="border-t border-line pt-4">{photo}</div>}

        <div className="border-t border-line pt-4">
          <p className="mb-2 text-sm text-stone">Photo changes and removals can&apos;t be undone.</p>
          <ConfirmDeleteButton
            action={onRemove}
            label="Remove from the page"
            prompt={`Remove ${memberName}? This can't be undone.`}
            confirmLabel="Yes, remove"
            cancelLabel="Keep"
            busyLabel="Removing…"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end border-t border-line pt-4">
        <button
          type="button"
          onClick={() => {
            if (!busy) onClose();
          }}
          aria-disabled={busy}
          className={`min-h-11 ${buttonClass("secondary")}`}
        >
          Done
        </button>
      </div>
    </EditDialog>
  );
}
