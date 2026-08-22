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
    <article className="surface-card reveal-rise overflow-clip">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <h3 className="font-display text-lg font-semibold text-ink">{label}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
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

      <div className="border-t border-line px-5 py-3 sm:px-6">
        <ExternalLink
          href={calendarSubscribeUrl(calendarId)}
          className="font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
        >
          {openLabel}
        </ExternalLink>
      </div>
    </article>
  );
}
