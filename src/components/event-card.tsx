import Link from "next/link";
import { EventMedia } from "@/components/event-media";
import { EventMeta } from "@/components/event-meta";
import { EventSignupLink } from "@/components/event-signup-link";
import { venueLabel } from "@/lib/center";
import type { Event } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { describeRepeat } from "@/lib/recurrence";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

const DEFAULT_SIZES =
  "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, (max-width: 1536px) 31vw, 360px";
export const FOUR_UP_SIZES =
  "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw";

export async function EventCard({
  event,
  index = 0,
  badge,
  withSignup = false,
  sizes = DEFAULT_SIZES,
  className = "",
}: {
  event: Event;
  index?: number;
  badge?: string;
  withSignup?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const date = formatEventDate(event.startAt, lang);
  const time = formatEventTime(event.startAt, event.endAt, lang);
  const venue = venueLabel(event.location, dict.events.atCenter);
  const repeat = describeRepeat(event, dict.events.repeat, lang);

  return (
    <div
      data-card
      className={`surface-card surface-card-link group relative flex flex-col overflow-clip rounded-none p-3.5 ${className}`}
    >
      {badge && (
        <span className="mb-2 w-fit rounded-md bg-magenta px-2.5 py-1 font-display text-[11px] font-semibold tracking-[0.1em] text-white uppercase">
          {badge}
        </span>
      )}
      <h3 className="line-clamp-2 font-display text-lg font-semibold text-ink transition-colors group-hover:text-indigo">
        <Link href={localePath(lang, `/events/${event.slug}`)} className="card-stretch">
          {event.title}
        </Link>
      </h3>
      {(date || time) && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
          {date && <EventMeta icon="calendar">{date}</EventMeta>}
          {time && <EventMeta icon="clock">{time}</EventMeta>}
        </p>
      )}
      {repeat && (
        <p className="mt-1 text-sm text-stone">
          <EventMeta icon="repeat">{repeat}</EventMeta>
        </p>
      )}
      <EventMedia
        flyerUrl={event.flyerUrl}
        flyerAlt={dict.eventDetail.flyerAlt.replace("{title}", event.title)}
        description={event.description}
        index={index}
        sizes={sizes}
        className="mt-3 grow"
      />
      <div className="mt-3.5 flex flex-col">
        {venue && (
          <p className="text-sm text-ink-soft">
            <EventMeta icon="pin">
              <span className="line-clamp-2">{venue}</span>
            </EventMeta>
          </p>
        )}
        {/* min-h aligns "Details" across cards with and without sign-up. */}
        <div className="mt-auto flex min-h-9 flex-wrap items-center justify-between gap-3 pt-3">
          <span className="link-arrow font-display text-sm font-semibold text-indigo">
            {dict.events.detailsCta}
          </span>
          {withSignup && event.signupUrl && (
            <EventSignupLink
              href={event.signupUrl}
              label={dict.events.signupCta}
              title={event.title}
              ariaTemplate={dict.events.signupAria}
            />
          )}
        </div>
      </div>
    </div>
  );
}
