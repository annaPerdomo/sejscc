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

type Group = InferSelectModel<typeof groupsTable>;
type Direction = "up" | "down";

const moveButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink hover:bg-mist disabled:opacity-30";

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
          <li key={group.id} className="flex items-center gap-3">
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
                  <AdminBadge tone={group.active ? "live" : "muted"}>
                    {group.active ? "On the site" : "Hidden"}
                  </AdminBadge>
                }
              />
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                data-move={`${group.id}-up`}
                disabled={busy || index === 0}
                onClick={() => move(group, index, "up")}
                aria-label={`Move ${group.name} up`}
                className={moveButtonClass}
              >
                ↑
              </button>
              <button
                type="button"
                data-move={`${group.id}-down`}
                disabled={busy || index === groups.length - 1}
                onClick={() => move(group, index, "down")}
                aria-label={`Move ${group.name} down`}
                className={moveButtonClass}
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
