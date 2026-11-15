"use client";

import Link from "next/link";
import { useState } from "react";
import { EventMeta } from "@/components/event-meta";
import { CALENDAR_SPACES, type CalendarSpace, type DayBooking } from "@/lib/calendar-spaces";

export type CalendarCell = {
  key: string;
  day: number;
  label: string;
  bookings: DayBooking[];
};

type Labels = {
  previous: string;
  next: string;
  today: string;
  backToToday: string;
  filter: string;
  allSpaces: string;
  none: string;
  noneInSpace: string;
  allDay: string;
  /** Template with a `{count}` placeholder. */
  more: string;
  /** Templates with `{date}` and `{count}` placeholders. */
  dayNone: string;
  dayOne: string;
  dayMany: string;
};

const SPACE_STYLES: Record<CalendarSpace, { chip: string; dot: string }> = {
  gym: { chip: "border-indigo bg-azure", dot: "bg-indigo" },
  dojo: { chip: "border-magenta bg-lilac", dot: "bg-magenta" },
  school: { chip: "border-navy bg-celadon", dot: "bg-navy" },
  rooms: { chip: "border-gold bg-butter", dot: "bg-gold" },
  kitchen: { chip: "border-blossom bg-peach", dot: "bg-blossom" },
  outdoors: { chip: "border-magenta-deep bg-cream", dot: "bg-magenta-deep" },
  whole: { chip: "border-ink-deep bg-cloud", dot: "bg-ink-deep" },
  other: { chip: "border-stone bg-mist", dot: "bg-stone" },
};

const CHIPS_PER_DAY = 3;
const DOTS_PER_DAY = 4;

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

const MONTH_LINK =
  "flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/60 text-white transition-colors hover:border-white hover:bg-white hover:text-navy";

export function FacilityCalendar({
  monthLabel,
  weekdays,
  weeks,
  todayKey,
  initialKey,
  previousHref,
  nextHref,
  todayHref,
  labels,
  spaceLabels,
}: {
  monthLabel: string;
  weekdays: { short: string; long: string }[];
  weeks: (CalendarCell | null)[][];
  todayKey: string;
  initialKey: string;
  previousHref: string | null;
  nextHref: string | null;
  /** Null while the month on screen is the current one. */
  todayHref: string | null;
  labels: Labels;
  spaceLabels: Record<CalendarSpace, string>;
}) {
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const [space, setSpace] = useState<CalendarSpace | null>(null);

  const cells = weeks.flat().filter((cell): cell is CalendarCell => cell !== null);
  const spacesInUse = CALENDAR_SPACES.filter((candidate) =>
    cells.some((cell) => cell.bookings.some((booking) => booking.space === candidate)),
  );
  const shown = (cell: CalendarCell) =>
    space ? cell.bookings.filter((booking) => booking.space === space) : cell.bookings;
  const selected = cells.find((cell) => cell.key === selectedKey) ?? cells[0];
  const selectedBookings = shown(selected);

  const dayAria = (cell: CalendarCell, count: number) =>
    (count === 0 ? labels.dayNone : count === 1 ? labels.dayOne : labels.dayMany)
      .replace("{date}", cell.label)
      .replace("{count}", String(count));

  return (
    <div className="overflow-clip rounded-sm bg-white shadow-xl ring-1 ring-ink/5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t-4 border-gold bg-navy px-5 py-5 text-white sm:px-8">
        <h3 className="font-display text-3xl font-light tracking-[0.01em] sm:text-4xl">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-3">
          {todayHref && (
            <Link
              href={todayHref}
              scroll={false}
              className="button-outline-light px-5 py-2.5 text-base tracking-[0.03em]"
            >
              {labels.backToToday}
            </Link>
          )}
          {previousHref && (
            <Link
              href={previousHref}
              scroll={false}
              aria-label={labels.previous}
              className={MONTH_LINK}
            >
              <Chevron direction="left" />
            </Link>
          )}
          {nextHref && (
            <Link href={nextHref} scroll={false} aria-label={labels.next} className={MONTH_LINK}>
              <Chevron direction="right" />
            </Link>
          )}
        </div>
      </div>

      {spacesInUse.length > 1 && (
        <div
          role="group"
          aria-label={labels.filter}
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4 sm:px-8"
        >
          {[null, ...spacesInUse].map((option) => {
            const pressed = space === option;
            return (
              <button
                key={option ?? "all"}
                type="button"
                aria-pressed={pressed}
                onClick={() => setSpace(option)}
                className={`flex min-h-11 items-center gap-2 rounded-full border-2 px-4 py-2 font-display text-base font-semibold transition-colors ${FOCUS_RING} ${
                  pressed
                    ? "border-navy bg-navy text-white"
                    : "border-line bg-white text-ink hover:border-ink"
                }`}
              >
                {option && (
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${pressed ? "bg-white" : SPACE_STYLES[option].dot}`}
                  />
                )}
                {option ? spaceLabels[option] : labels.allSpaces}
              </button>
            );
          })}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div aria-hidden="true" className="grid grid-cols-7 border-b border-line bg-mist">
            {weekdays.map((weekday) => (
              <span
                key={weekday.long}
                className="py-2.5 text-center font-display text-sm font-semibold tracking-[0.08em] text-ink-soft uppercase"
              >
                {weekday.short}
              </span>
            ))}
          </div>
          {weeks.map((week, row) => (
            <div key={row} className="grid grid-cols-7">
              {week.map((cell, column) => {
                if (!cell) {
                  return (
                    <div
                      key={column}
                      className="border-b border-line bg-mist/60 not-first:border-l"
                    />
                  );
                }
                const bookings = shown(cell);
                const isSelected = cell.key === selected.key;
                const isToday = cell.key === todayKey;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={dayAria(cell, bookings.length)}
                    onClick={() => setSelectedKey(cell.key)}
                    className={`relative flex min-h-16 min-w-0 flex-col items-center gap-1 border-b border-line p-1.5 text-left transition-colors not-first:border-l focus-visible:z-10 lg:min-h-36 lg:items-stretch lg:p-2 ${FOCUS_RING} ${
                      isSelected ? "bg-azure ring-2 ring-indigo ring-inset" : "hover:bg-mist"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold ${
                        isToday ? "bg-magenta text-white" : "text-ink"
                      }`}
                    >
                      {cell.day}
                    </span>
                    <span aria-hidden="true" className="flex flex-wrap justify-center gap-1 lg:hidden">
                      {bookings.slice(0, DOTS_PER_DAY).map((booking) => (
                        <span
                          key={booking.id}
                          className={`h-1.5 w-1.5 rounded-full ${SPACE_STYLES[booking.space].dot}`}
                        />
                      ))}
                    </span>
                    <span aria-hidden="true" className="hidden min-w-0 flex-col gap-1 lg:flex">
                      {bookings.slice(0, CHIPS_PER_DAY).map((booking) => (
                        <span
                          key={booking.id}
                          className={`truncate rounded-xs border-l-4 px-1.5 py-0.5 text-xs leading-snug text-ink xl:text-sm ${SPACE_STYLES[booking.space].chip}`}
                        >
                          {booking.title}
                        </span>
                      ))}
                      {bookings.length > CHIPS_PER_DAY && (
                        <span className="px-1.5 font-display text-xs font-semibold text-ink-soft xl:text-sm">
                          {labels.more.replace("{count}", String(bookings.length - CHIPS_PER_DAY))}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div aria-live="polite" className="px-5 py-7 sm:px-8 lg:col-span-4 lg:border-l lg:border-line">
          {selected.key === todayKey && (
            <p className="mb-1 font-display text-sm font-semibold tracking-[0.16em] text-magenta-deep uppercase">
              {labels.today}
            </p>
          )}
          <h4 className="font-display text-2xl font-semibold text-ink">{selected.label}</h4>
          {selectedBookings.length === 0 ? (
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              {space ? labels.noneInSpace : labels.none}
            </p>
          ) : (
            <ul className="mt-5 flex flex-col gap-3">
              {selectedBookings.map((booking) => (
                <li
                  key={booking.id}
                  className={`rounded-xs border-l-4 px-4 py-3 ${SPACE_STYLES[booking.space].chip}`}
                >
                  <p className="font-display text-base font-semibold text-ink-soft">
                    {booking.time ?? labels.allDay}
                  </p>
                  <p className="font-display text-xl leading-snug font-semibold text-pretty text-ink">
                    {booking.title}
                  </p>
                  {booking.location && (
                    <p className="mt-0.5 text-base text-ink-soft">
                      <EventMeta icon="pin">{booking.location}</EventMeta>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
