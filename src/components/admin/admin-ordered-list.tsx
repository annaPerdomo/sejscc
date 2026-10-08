"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminEmptyState } from "@/components/admin/admin-card";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

type OrderedItem = { id: string; visible: boolean };

type Direction = "up" | "down";

type FocusTarget = { selector: string } | { addButton: true };

const ACTION_BUTTON_CLASS =
  "flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist hover:text-indigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo aria-disabled:pointer-events-none aria-disabled:opacity-50";

function moveSelector(id: string, direction: Direction) {
  return `[data-move="${id}-${direction}"]`;
}

function editSelector(id: string) {
  return `[data-edit="${id}"]`;
}

function toggleSelector(id: string) {
  return `[data-toggle="${id}"]`;
}

export function AdminOrderedList<T extends OrderedItem>({
  items,
  itemNoun,
  itemLabel,
  addLabel,
  emptyTitle,
  emptyBody,
  renderSummary,
  renderForm,
  onReorder,
  onToggleVisible,
  onDelete,
  onStatus,
}: {
  items: T[];
  itemNoun: string;
  itemLabel: (item: T) => string;
  addLabel: string;
  emptyTitle: string;
  emptyBody: ReactNode;
  renderSummary: (item: T) => ReactNode;
  renderForm: (
    item: T | undefined,
    close: () => void,
    onSaved: (message: string) => void
  ) => ReactNode;
  onReorder: (orderedIds: string[]) => Promise<void>;
  onToggleVisible: (id: string, next: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStatus: (message: string) => void;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(items);
  const [syncedItems, setSyncedItems] = useState(items);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [movePending, setMovePending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<FocusTarget | null>(null);
  const [pendingNewRowIds, setPendingNewRowIds] = useState<Set<string> | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  if (items !== syncedItems && !movePending) {
    if (pendingNewRowIds) {
      const newIds = items.map((item) => item.id).filter((id) => !pendingNewRowIds.has(id));
      setPendingFocus(
        newIds.length === 1 ? { selector: editSelector(newIds[0]) } : { addButton: true }
      );
      setPendingNewRowIds(null);
    }
    setSyncedItems(items);
    setOrder(items);
  }

  useEffect(() => {
    if (!pendingFocus) return;
    if ("addButton" in pendingFocus) {
      addButtonRef.current?.focus();
    } else {
      document.querySelector<HTMLButtonElement>(pendingFocus.selector)?.focus();
    }
  }, [pendingFocus]);

  async function move(item: T, index: number, direction: Direction) {
    const to = direction === "up" ? index - 1 : index + 1;
    if (to < 0 || to >= order.length) return;
    const previous = order;
    const next = [...order];
    [next[index], next[to]] = [next[to], next[index]];
    const landedDirection =
      direction === "up" ? (to === 0 ? "down" : "up") : to === next.length - 1 ? "up" : "down";

    setOrder(next);
    setMovePending(true);
    setError(null);
    setPendingFocus({ selector: moveSelector(item.id, landedDirection) });
    try {
      await onReorder(next.map((row) => row.id));
      onStatus(`${itemLabel(item)} moved to position ${to + 1} of ${next.length}.`);
      router.refresh();
    } catch (e) {
      setOrder(previous);
      setPendingFocus({ selector: moveSelector(item.id, direction) });
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving the new order. Please try again."
      );
    } finally {
      setMovePending(false);
    }
  }

  async function toggleVisible(item: T) {
    setError(null);
    setBusyId(item.id);
    const next = !item.visible;
    try {
      await onToggleVisible(item.id, next);
      setOrder((current) =>
        current.map((row) => (row.id === item.id ? { ...row, visible: next } : row))
      );
      setPendingFocus({ selector: toggleSelector(item.id) });
      onStatus(`${itemLabel(item)} is now ${next ? "showing on the website" : "hidden"}.`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong saving that change. Please try again."
      );
    } finally {
      setBusyId(null);
    }
  }

  function openEditor(item: T) {
    if (busyId === item.id) return;
    setAdding(false);
    setOpenId(item.id);
  }

  function closeEditor(item: T) {
    setOpenId(null);
    setPendingFocus({ selector: editSelector(item.id) });
  }

  function savedEditor(item: T, message: string) {
    setOpenId(null);
    setPendingFocus({ selector: editSelector(item.id) });
    onStatus(message);
    router.refresh();
  }

  function openAdd() {
    setOpenId(null);
    setAdding(true);
  }

  function cancelAdd() {
    setAdding(false);
    setPendingFocus({ addButton: true });
  }

  function savedAdd(message: string) {
    setPendingNewRowIds(new Set(order.map((item) => item.id)));
    setAdding(false);
    onStatus(message);
    router.refresh();
  }

  async function remove(item: T, index: number) {
    await onDelete(item.id);
    const neighbor = order[index + 1] ?? order[index - 1];
    setPendingFocus(
      neighbor ? { selector: editSelector(neighbor.id) } : { addButton: true }
    );
    setOrder((current) => current.filter((row) => row.id !== item.id));
    setOpenId((current) => (current === item.id ? null : current));
    onStatus(`${itemLabel(item)} removed.`);
  }

  return (
    <div>
      {error && (
        <div className="mb-4">
          <AdminAlert>{error}</AdminAlert>
        </div>
      )}

      {order.length === 0 && !adding ? (
        <AdminEmptyState title={emptyTitle}>{emptyBody}</AdminEmptyState>
      ) : (
        <ul className="space-y-3">
          {order.map((item, index) => {
            const isOpen = openId === item.id;
            const busy = busyId === item.id;
            return (
              <li
                key={item.id}
                className={`rounded-xl border ${
                  item.visible ? "border-line bg-white" : "border-dashed border-line bg-mist"
                }`}
              >
                {isOpen ? (
                  renderForm(
                    item,
                    () => closeEditor(item),
                    (message) => savedEditor(item, message)
                  )
                ) : (
                  <div className="flex flex-wrap items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">{renderSummary(item)}</div>
                    <AdminBadge tone={item.visible ? "live" : "muted"}>
                      {item.visible ? "On the website" : "Hidden"}
                    </AdminBadge>
                    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap sm:justify-end">
                      <button
                        type="button"
                        data-move={`${item.id}-up`}
                        aria-disabled={movePending || index === 0}
                        onClick={() => {
                          if (movePending || index === 0) return;
                          void move(item, index, "up");
                        }}
                        className={ACTION_BUTTON_CLASS}
                      >
                        Move up<span className="sr-only"> {itemLabel(item)}</span>
                      </button>
                      <button
                        type="button"
                        data-move={`${item.id}-down`}
                        aria-disabled={movePending || index === order.length - 1}
                        onClick={() => {
                          if (movePending || index === order.length - 1) return;
                          void move(item, index, "down");
                        }}
                        className={ACTION_BUTTON_CLASS}
                      >
                        Move down<span className="sr-only"> {itemLabel(item)}</span>
                      </button>
                      <button
                        type="button"
                        data-toggle={item.id}
                        aria-disabled={busy}
                        onClick={() => {
                          if (busy) return;
                          void toggleVisible(item);
                        }}
                        className={ACTION_BUTTON_CLASS}
                      >
                        {item.visible ? "Hide" : "Show"}
                        <span className="sr-only"> {itemLabel(item)}</span>
                      </button>
                      <button
                        type="button"
                        data-edit={item.id}
                        aria-disabled={busy}
                        onClick={() => openEditor(item)}
                        className={ACTION_BUTTON_CLASS}
                      >
                        Edit<span className="sr-only"> {itemLabel(item)}</span>
                      </button>
                      <div className="col-span-2">
                        <ConfirmDeleteButton
                          action={() => remove(item, index)}
                          label={`Remove ${itemLabel(item)}`}
                          prompt={`Remove this ${itemNoun}? This can't be undone.`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5">
        {adding ? (
          <div className="rounded-xl border border-line bg-white">
            {renderForm(undefined, cancelAdd, savedAdd)}
          </div>
        ) : (
          <AdminButton type="button" variant="primary" ref={addButtonRef} onClick={openAdd}>
            {addLabel}
          </AdminButton>
        )}
      </div>
    </div>
  );
}
