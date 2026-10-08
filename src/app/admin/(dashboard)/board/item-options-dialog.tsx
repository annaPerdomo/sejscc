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

export function ItemOptionsDialog({
  kind,
  open,
  onClose,
  itemName,
  index,
  total,
  moveBusy,
  onMove,
  visible,
  visibleBusy,
  onToggleVisible,
  onRemove,
  children,
}: {
  kind: "member" | "role";
  open: boolean;
  onClose: () => void;
  itemName: string;
  index: number;
  total: number;
  moveBusy: boolean;
  onMove: (direction: "up" | "down") => void;
  visible: boolean;
  visibleBusy: boolean;
  onToggleVisible: () => void;
  onRemove: () => Promise<void>;
  children?: ReactNode;
}) {
  return (
    <EditDialog title={itemName} open={open} onClose={onClose}>
      <div className="space-y-4">
        {index > 0 && (
          <OptionButton
            onClick={() => onMove("up")}
            disabled={moveBusy}
            focusKey={`${kind}-dialog-move-up`}
          >
            Move up<span className="sr-only"> {itemName}</span>
          </OptionButton>
        )}
        {index < total - 1 && (
          <OptionButton
            onClick={() => onMove("down")}
            disabled={moveBusy}
            focusKey={`${kind}-dialog-move-down`}
          >
            Move down<span className="sr-only"> {itemName}</span>
          </OptionButton>
        )}

        <div>
          <OptionButton
            onClick={onToggleVisible}
            disabled={visibleBusy}
            focusKey={`${kind}-dialog-visibility`}
          >
            {visible ? "Hide from website" : "Show on website"}
          </OptionButton>
          <p className="mt-1 text-sm text-stone">
            Hidden items stay here so you can show them again later.
          </p>
        </div>

        {children}

        <div className="border-t border-line pt-4">
          <p className="mb-2 text-sm text-stone">Photo changes and removals can&apos;t be undone.</p>
          <ConfirmDeleteButton
            action={onRemove}
            label="Remove from the page"
            prompt={`Remove ${itemName}? This can't be undone.`}
            confirmLabel="Yes, remove"
            cancelLabel="Keep"
            busyLabel="Removing…"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end border-t border-line pt-4">
        <button type="button" onClick={onClose} className={`min-h-11 ${buttonClass("secondary")}`}>
          Done
        </button>
      </div>
    </EditDialog>
  );
}
