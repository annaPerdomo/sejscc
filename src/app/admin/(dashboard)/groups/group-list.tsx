"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InferSelectModel } from "drizzle-orm";
import type { groups as groupsTable } from "@/db/schema";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { AdminButton } from "@/components/admin/admin-button";
import { adminPanel } from "@/components/admin/admin-card";
import { AdminListRow } from "@/components/admin/admin-list-row";
import { reorderGroups, type ReorderResult } from "./actions";
import { GROUP_STATUS_LABELS } from "./status";

type Group = InferSelectModel<typeof groupsTable>;
type Direction = "up" | "down";

const CHEVRON_PATHS: Record<Direction, string> = {
  up: "M7 14l5-5 5 5",
  down: "M7 10l5 5 5-5",
};

const moveButtonClass =
  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-3 py-3 text-sm font-semibold text-ink transition hover:bg-mist hover:text-indigo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:pointer-events-none disabled:opacity-50 sm:flex-none";

const reorderRowClass =
  "flex flex-wrap items-center gap-x-3 gap-y-3 p-4 transition";
const movedRowClass = "rounded-xl border border-indigo bg-mist";

const SAVE_FAILED_MESSAGE =
  "Something went wrong saving the new order. Please try again.";
const STALE_LIST_MESSAGE =
  "The groups changed while you were reordering, so your new order wasn’t saved. The list below is up to date — please put it in order again.";

function MoveIcon({ direction }: { direction: Direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d={CHEVRON_PATHS[direction]}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function swapped(list: Group[], index: number, direction: Direction) {
  const to = direction === "up" ? index - 1 : index + 1;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

export function GroupList({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const listRef = useRef<HTMLOListElement>(null);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const instructionsRef = useRef<HTMLParagraphElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<{ id: string; direction: Direction } | null>(null);
  const pendingModeFocus = useRef<"start" | "instructions" | null>(null);
  const [draft, setDraft] = useState<Group[] | null>(null);
  const [movedId, setMovedId] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [status, setStatus] = useState("");
  const [saving, startSaving] = useTransition();

  const reordering = draft !== null;
  const ordered = draft ?? groups;

  useEffect(() => {
    const target = pendingModeFocus.current;
    if (!target) return;
    pendingModeFocus.current = null;
    if (target === "start") startButtonRef.current?.focus();
    else instructionsRef.current?.focus();
  }, [reordering]);

  // Boxed in an object so a repeat of the same message is still a new value: a
  // bare string would compare equal, skip the render, and never move focus.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  // A move can push a group to an end of the list, disabling the button that
  // was just pressed. Follow the group to its new row instead.
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const index = ordered.findIndex((group) => group.id === target.id);
    if (index === -1) return;
    const stillMovable =
      target.direction === "up" ? index > 0 : index < ordered.length - 1;
    const direction = stillMovable
      ? target.direction
      : target.direction === "up"
        ? "down"
        : "up";
    listRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-move="${target.id}-${direction}"]`
      )
      ?.focus();
  }, [ordered]);

  function startReordering() {
    setError(null);
    setMovedId(null);
    setDraft(groups);
    pendingModeFocus.current = "instructions";
    setStatus(
      "Reordering groups. Move each group up or down, then choose Save order."
    );
  }

  function stopReordering(
    message: string,
    focusTarget: "start" | null = "start"
  ) {
    pendingModeFocus.current = focusTarget;
    setDraft(null);
    setMovedId(null);
    setStatus(message);
  }

  function move(group: Group, index: number, direction: Direction) {
    const next = swapped(ordered, index, direction);
    if (next === ordered) return;
    pendingFocus.current = { id: group.id, direction };
    setDraft(next);
    setMovedId(group.id);
    setStatus(
      `${group.name} moved to position ${next.indexOf(group) + 1} of ${
        next.length
      }. Not saved yet.`
    );
  }

  function save() {
    if (!draft) return;
    setError(null);
    startSaving(async () => {
      let result: ReorderResult;
      try {
        result = await reorderGroups(draft.map((group) => group.id));
      } catch {
        setError({ message: SAVE_FAILED_MESSAGE });
        return;
      }
      if (!result.ok) {
        // Focus goes to the explanation, not to the Change order button.
        stopReordering("", null);
        setError({ message: STALE_LIST_MESSAGE });
        router.refresh();
        return;
      }
      // Both updates sit in the transition, so the draft order stays on screen
      // until the refreshed rows arrive rather than flashing back to the old one.
      stopReordering("New order saved.");
      router.refresh();
    });
  }

  if (groups.length < 2) {
    return (
      <ul className="mt-8 space-y-3">
        {groups.map((group) => (
          <li key={group.id}>
            <GroupCard group={group} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-8">
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          ref={instructionsRef}
          tabIndex={-1}
          className="max-w-md text-sm text-stone focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo"
        >
          Groups appear on the website in this order, top to bottom. Paused and
          discontinued groups always come after the rest.
          {reordering && " Move them, then choose Save order."}
        </p>
        {reordering ? (
          <div className="flex gap-3">
            <AdminButton
              disabled={saving}
              onClick={() => stopReordering("Reordering cancelled.")}
            >
              Cancel
            </AdminButton>
            <AdminButton variant="primary" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save order"}
            </AdminButton>
          </div>
        ) : (
          <AdminButton ref={startButtonRef} onClick={startReordering}>
            Change order
          </AdminButton>
        )}
      </div>

      {error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          className="mt-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo"
        >
          <AdminAlert>{error.message}</AdminAlert>
        </div>
      )}

      <ol ref={listRef} className="mt-4 space-y-3">
        {ordered.map((group, index) => (
          <li key={group.id}>
            {reordering ? (
              <div
                className={`${reorderRowClass} ${
                  group.id === movedId ? movedRowClass : adminPanel
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist font-display text-sm font-semibold text-ink-soft">
                  {index + 1}
                </span>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-line bg-mist">
                  <GroupThumbnail group={group} sizes="40px" />
                </div>
                <p className="min-w-0 flex-1 truncate font-semibold text-ink">
                  {group.name}
                </p>
                <GroupBadges group={group} />
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    type="button"
                    data-move={`${group.id}-up`}
                    disabled={saving || index === 0}
                    onClick={() => move(group, index, "up")}
                    className={moveButtonClass}
                  >
                    <MoveIcon direction="up" />
                    Move up
                    <span className="sr-only">{group.name}</span>
                  </button>
                  <button
                    type="button"
                    data-move={`${group.id}-down`}
                    disabled={saving || index === ordered.length - 1}
                    onClick={() => move(group, index, "down")}
                    className={moveButtonClass}
                  >
                    <MoveIcon direction="down" />
                    Move down
                    <span className="sr-only">{group.name}</span>
                  </button>
                </div>
              </div>
            ) : (
              <GroupCard group={group} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function GroupThumbnail({ group, sizes }: { group: Group; sizes: string }) {
  if (!group.imageUrl) return null;
  return (
    <Image
      src={group.imageUrl}
      alt=""
      fill
      sizes={sizes}
      className="object-cover"
    />
  );
}

function GroupBadges({ group }: { group: Group }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {group.active && group.status === "paused" && (
        <AdminBadge tone="pending">{GROUP_STATUS_LABELS.paused}</AdminBadge>
      )}
      {group.active && group.status === "cancelled" && (
        <AdminBadge tone="cancelled">{GROUP_STATUS_LABELS.cancelled}</AdminBadge>
      )}
      <AdminBadge tone={group.active ? "live" : "muted"}>
        {group.active ? "On the site" : "Hidden"}
      </AdminBadge>
    </div>
  );
}

function GroupCard({ group }: { group: Group }) {
  return (
    <AdminListRow
      href={`/admin/groups/${group.id}`}
      thumbnail={<GroupThumbnail group={group} sizes="64px" />}
      title={group.name}
      subtitle={group.meetingSchedule}
      badge={<GroupBadges group={group} />}
    />
  );
}
