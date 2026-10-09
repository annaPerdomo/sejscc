"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SchoolYearEvent } from "@/db/schema";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass } from "@/components/admin/admin-button";
import { adminPanel } from "@/components/admin/admin-card";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { monthOrderInSeason, seasonIdForMonth } from "@/lib/school-year";
import { setSchoolYearEventVisible } from "./actions";
import { MONTH_NAMES, SEASON_LABELS, SEASON_ORDER } from "./months";

const controlButtonClass = `min-h-11 flex-1 text-center sm:flex-none ${buttonClass("secondary")}`;

function EventThumbnail({ event }: { event: SchoolYearEvent }) {
  if (!event.photoUrl) {
    return <PhotoPlaceholder label="No photo" frame={false} className="h-full w-full" />;
  }
  return <Image src={event.photoUrl} alt="" fill sizes="96px" className="object-cover" />;
}

function badgeFor(event: SchoolYearEvent): { tone: "live" | "muted" | "pending"; label: string } {
  if (!event.photoUrl) return { tone: "pending", label: "Needs a photo" };
  if (!event.visible) return { tone: "muted", label: "Hidden" };
  return { tone: "live", label: "Showing" };
}

export function EventList({ events }: { events: SchoolYearEvent[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggleVisible(event: SchoolYearEvent) {
    setError(null);
    setBusyId(event.id);
    startTransition(async () => {
      try {
        await setSchoolYearEventVisible(event.id, !event.visible);
      } catch {
        setError("Something went wrong saving this. Please try again.");
      }
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 space-y-10">
      {error && <AdminAlert>{error}</AdminAlert>}
      {SEASON_ORDER.map((seasonId) => {
        const seasonEvents = events
          .filter((event) => seasonIdForMonth(event.month) === seasonId)
          .sort(
            (a, b) =>
              monthOrderInSeason(a.month) - monthOrderInSeason(b.month) || a.sortOrder - b.sortOrder
          );
        if (seasonEvents.length === 0) return null;
        return (
          <div key={seasonId}>
            <h2 className="font-display text-sm font-semibold tracking-widest text-stone uppercase">
              {SEASON_LABELS[seasonId]}
            </h2>
            <ol className="mt-3 space-y-3">
              {seasonEvents.map((event) => {
                const badge = badgeFor(event);
                return (
                  <li
                    key={event.id}
                    className={`${adminPanel} flex flex-wrap items-center gap-x-4 gap-y-3 p-4`}
                  >
                    <div className="relative aspect-photo w-24 shrink-0 overflow-clip rounded-md border border-line bg-mist">
                      <EventThumbnail event={event} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{event.title}</p>
                      <p className="mt-0.5 truncate text-sm text-stone">
                        {MONTH_NAMES[event.month - 1]} · {event.when}
                      </p>
                    </div>
                    <AdminBadge tone={badge.tone}>{badge.label}</AdminBadge>
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => toggleVisible(event)}
                        className={controlButtonClass}
                      >
                        {event.visible ? "Hide from website" : "Show on website"}
                        <span className="sr-only"> {event.title}</span>
                      </button>
                      <Link href={`/admin/school-year/${event.id}`} className={controlButtonClass}>
                        Edit<span className="sr-only"> {event.title}</span>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
