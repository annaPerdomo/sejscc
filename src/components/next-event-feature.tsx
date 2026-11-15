import Image from "next/image";
import Link from "next/link";
import { DatePage } from "@/components/date-page";
import { EventMeta } from "@/components/event-meta";
import { EventSignupLink } from "@/components/event-signup-link";
import { venueLabel } from "@/lib/center";
import type { Event } from "@/lib/events";
import {
  formatEventDay,
  formatEventMonth,
  formatEventTime,
  formatShortEventDate,
  formatWeekday,
} from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";
import { getImageSize } from "@/lib/image-size";
import { describeRepeat } from "@/lib/recurrence";

export async function NextEventFeature({ event }: { event: Event }) {
  const [lang, dict, flyerSize] = await Promise.all([
    getLocale(),
    getDictionary(),
    event.flyerUrl ? getImageSize(event.flyerUrl) : null,
  ]);
  const href = localePath(lang, `/events/${event.slug}`);
  const month = formatEventMonth(event.startAt, lang);
  const day = formatEventDay(event.startAt, lang);
  const date = formatShortEventDate(event.startAt, lang);
  const weekday = event.startAt ? formatWeekday(event.startAt, lang) : null;
  const time = formatEventTime(event.startAt, event.endAt, lang);
  const venue = venueLabel(event.location, dict.events.atCenter);
  const repeat = describeRepeat(event, dict.events.repeat, lang);

  return (
    <article className="flex items-center gap-5 sm:gap-7 border-y border-gold/70 py-4">
      {event.flyerUrl ? (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          data-edit-record={`event:${event.id}:details`}
          className="w-28 shrink-0 overflow-clip rounded-xs border-2 border-white bg-cream shadow-lg shadow-ink-deep/50 sm:w-36 lg:w-44"
        >
          <Image
            src={event.flyerUrl}
            alt=""
            width={flyerSize?.width ?? 800}
            height={flyerSize?.height ?? 1000}
            preload
            sizes="(max-width: 40rem) 7rem, 11rem"
            className="h-auto w-full"
          />
        </Link>
      ) : (
        month &&
        day && (
          <span data-edit-record={`event:${event.id}:details`} className="contents">
            <DatePage month={month} day={day} weekday={weekday} size="md" />
          </span>
        )
      )}
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold tracking-[0.16em] text-blossom uppercase">
          {dict.events.nextUpBadge}
        </p>
        <h2
          data-edit-record={`event:${event.id}:title`}
          className="mt-1 font-display text-2xl leading-tight font-semibold text-pretty text-white"
        >
          <Link
            href={href}
            className="underline decoration-sky/70 decoration-2 underline-offset-4 hover:decoration-gold"
          >
            {event.title}
          </Link>
        </h2>
        <p
          data-edit-record={`event:${event.id}:details`}
          className="mt-1.5 font-display text-lg font-semibold text-white"
        >
          {[date, time, repeat].filter(Boolean).join(" · ")}
        </p>
        {venue && (
          <p data-edit-record={`event:${event.id}:location`} className="text-base text-white/90">
            <EventMeta icon="pin">{venue}</EventMeta>
          </p>
        )}
        {event.signupUrl && (
          <div className="mt-3">
            <EventSignupLink
              href={event.signupUrl}
              label={dict.events.signupCta}
              title={event.title}
              ariaTemplate={dict.events.signupAria}
            />
          </div>
        )}
      </div>
    </article>
  );
}
