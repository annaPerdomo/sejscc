"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { InferSelectModel } from "drizzle-orm";
import type { groups as groupsTable } from "@/db/schema";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { AdminListRow } from "@/components/admin/admin-list-row";
import { moveGroup } from "./actions";
import { GROUP_STATUS_LABELS } from "./status";

type Group = InferSelectModel<typeof groupsTable>;
type Direction = "up" | "down";

const CHEVRON_PATHS: Record<Direction, string> = {
  up: "M7 14l5-5 5 5",
  down: "M7 10l5 5 5-5",
};

const moveButtonClass =
  "relative flex h-11 w-11 items-center justify-center rounded-md text-ink-soft transition hover:bg-mist hover:text-indigo focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo disabled:pointer-events-none disabled:text-line";

function MoveIcon({ direction }: { direction: Direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
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

export function GroupList({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const pendingFocus = useRef<{ id: string; direction: Direction } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // A move re-renders the list from the server, and an arrow that reaches the
  // end of the list comes back disabled — which would drop a keyboard user's
  // focus to the top of the page. Follow the group to its new row instead.
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const index = groups.findIndex((group) => group.id === target.id);
    if (index === -1) return;
    const stillMovable =
      target.direction === "up" ? index > 0 : index < groups.length - 1;
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
  }, [groups]);

  async function move(group: Group, index: number, direction: Direction) {
    setError(null);
    setBusy(true);
    try {
      await moveGroup(group.id, direction);
      pendingFocus.current = { id: group.id, direction };
      const position = direction === "up" ? index : index + 2;
      setStatus(
        `Moved ${group.name} to position ${position} of ${groups.length}.`
      );
      router.refresh();
    } catch {
      setStatus("");
      setError("We couldn’t change the order just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const reorderable = groups.length > 1;

  return (
    <div className="mt-8">
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      {error && (
        <div className="mb-4">
          <AdminAlert>{error}</AdminAlert>
        </div>
      )}
      <ul ref={listRef} className="space-y-3">
        {groups.map((group, index) => (
          <li key={group.id} className="flex items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <AdminListRow
                href={`/admin/groups/${group.id}`}
                thumbnail={
                  group.imageUrl ? (
                    <Image
                      src={group.imageUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null
                }
                title={group.name}
                subtitle={group.meetingSchedule}
                badge={
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {group.active && group.status === "paused" && (
                      <AdminBadge tone="pending">
                        {GROUP_STATUS_LABELS.paused}
                      </AdminBadge>
                    )}
                    {group.active && group.status === "cancelled" && (
                      <AdminBadge tone="cancelled">
                        {GROUP_STATUS_LABELS.cancelled}
                      </AdminBadge>
                    )}
                    <AdminBadge tone={group.active ? "live" : "muted"}>
                      {group.active ? "On the site" : "Hidden"}
                    </AdminBadge>
                  </div>
                }
              />
            </div>
            {reorderable && (
              <div className="flex shrink-0 flex-col rounded-lg border border-line bg-white">
                <button
                  type="button"
                  data-move={`${group.id}-up`}
                  disabled={busy || index === 0}
                  onClick={() => move(group, index, "up")}
                  aria-label={`Move ${group.name} up`}
                  className={moveButtonClass}
                >
                  <MoveIcon direction="up" />
                </button>
                <span aria-hidden="true" className="mx-2 h-px bg-line" />
                <button
                  type="button"
                  data-move={`${group.id}-down`}
                  disabled={busy || index === groups.length - 1}
                  onClick={() => move(group, index, "down")}
                  aria-label={`Move ${group.name} down`}
                  className={moveButtonClass}
                >
                  <MoveIcon direction="down" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
