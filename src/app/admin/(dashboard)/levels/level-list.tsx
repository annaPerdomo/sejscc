"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SchoolLevel } from "@/db/schema";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { adminPanel } from "@/components/admin/admin-card";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { reorderSchoolLevels, setSchoolLevelVisible, type ReorderResult } from "./actions";

type Direction = "up" | "down";

const controlButtonClass = `min-h-11 flex-1 text-center sm:flex-none ${buttonClass("secondary")}`;

const SAVE_FAILED_MESSAGE =
  "Something went wrong saving the new order. Please try again.";
const STALE_LIST_MESSAGE =
  "The list changed while you were reordering, so that move wasn’t saved. The list below is up to date — please try again.";

function swapped(list: SchoolLevel[], index: number, direction: Direction) {
  const to = direction === "up" ? index - 1 : index + 1;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

function LevelThumbnail({ level, sizes }: { level: SchoolLevel; sizes: string }) {
  if (!level.photoUrl) {
    return (
      <PhotoPlaceholder label="No photo" frame={false} className="h-full w-full" />
    );
  }
  return (
    <Image src={level.photoUrl} alt="" fill sizes={sizes} className="object-cover" />
  );
}

export function LevelList({ levels }: { levels: SchoolLevel[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function move(level: SchoolLevel, index: number, direction: Direction) {
    const next = swapped(levels, index, direction);
    if (next === levels) return;
    setError(null);
    setBusyId(level.id);
    startTransition(async () => {
      let result: ReorderResult;
      try {
        result = await reorderSchoolLevels(next.map((item) => item.id));
      } catch {
        setError(SAVE_FAILED_MESSAGE);
        setBusyId(null);
        return;
      }
      if (!result.ok) setError(STALE_LIST_MESSAGE);
      setBusyId(null);
      router.refresh();
    });
  }

  function toggleVisible(level: SchoolLevel) {
    setError(null);
    setBusyId(level.id);
    startTransition(async () => {
      try {
        await setSchoolLevelVisible(level.id, !level.visible);
      } catch {
        setError("Something went wrong saving this. Please try again.");
      }
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-8">
      {error && (
        <div className="mb-4">
          <AdminAlert>{error}</AdminAlert>
        </div>
      )}
      <ol className="space-y-3">
        {levels.map((level, index) => (
          <li
            key={level.id}
            className={`${adminPanel} flex flex-wrap items-center gap-x-4 gap-y-3 p-4`}
          >
            <div className="relative aspect-photo w-24 shrink-0 overflow-clip rounded-md border border-line bg-mist">
              <LevelThumbnail level={level} sizes="96px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{level.name}</p>
              <p className="mt-0.5 truncate text-sm text-stone">{level.summary}</p>
            </div>
            <AdminBadge tone={level.visible ? "live" : "muted"}>
              {level.visible ? "Showing" : "Hidden"}
            </AdminBadge>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {index > 0 && (
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => move(level, index, "up")}
                  className={controlButtonClass}
                >
                  Move up<span className="sr-only"> {level.name}</span>
                </button>
              )}
              {index < levels.length - 1 && (
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => move(level, index, "down")}
                  className={controlButtonClass}
                >
                  Move down<span className="sr-only"> {level.name}</span>
                </button>
              )}
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() => toggleVisible(level)}
                className={controlButtonClass}
              >
                {level.visible ? "Hide from website" : "Show on website"}
                <span className="sr-only"> {level.name}</span>
              </button>
              <Link href={`/admin/levels/${level.id}`} className={controlButtonClass}>
                Edit<span className="sr-only"> {level.name}</span>
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
