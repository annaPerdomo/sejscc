"use client";

import { useSyncExternalStore } from "react";
import { ExternalLink } from "@/components/external-link";
import {
  calendarEmbedUrl,
  calendarSubscribeUrl,
  type CalendarSource,
  type CalendarView,
} from "@/lib/calendars";
import type { Locale } from "@/lib/i18n";

const WIDE_QUERY = "(min-width: 48rem)";

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// A hidden iframe still fetches its src, so rendering both views and hiding
// one with CSS would load the calendar twice.
function useIsWideScreen(): boolean | null {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => null,
  );
}

function useCalendarView(
  compactView: CalendarView,
  wideView: CalendarView,
): CalendarView | null {
  const isWideScreen = useIsWideScreen();
  if (compactView === wideView) return wideView;
  if (isWideScreen === null) return null;
  return isWideScreen ? wideView : compactView;
}

export function GoogleCalendar({
  source,
  locale,
  label,
  description,
  frameTitle,
  openLabel,
}: {
  source: CalendarSource;
  locale: Locale;
  label: string;
  description: string;
  frameTitle: string;
  openLabel: string;
}) {
  const { calendarId, compactView, wideView, frameHeight } = source;
  const view = useCalendarView(compactView, wideView);

  return (
    <article className="reveal-rise mt-3 rounded-sm bg-white shadow-xl ring-1 ring-ink/5">
      <div className="calendar-binding rounded-t-sm px-6 pt-8 pb-6 sm:px-8">
        <h3 className="font-display text-2xl font-semibold text-white">{label}</h3>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/85">
          {description}
        </p>
      </div>

      {view ? (
        <iframe
          src={calendarEmbedUrl(calendarId, view, locale)}
          title={frameTitle}
          loading="lazy"
          className={`w-full border-0 bg-white ${frameHeight}`}
        />
      ) : (
        <div className={`w-full bg-white ${frameHeight}`} />
      )}

      <div className="border-t border-line px-6 py-4 sm:px-8">
        <ExternalLink
          href={calendarSubscribeUrl(calendarId)}
          className="link-arrow font-display text-base font-semibold text-indigo hover:text-indigo-deep"
        >
          {openLabel}
        </ExternalLink>
      </div>
    </article>
  );
}
