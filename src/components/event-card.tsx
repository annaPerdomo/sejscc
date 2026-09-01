import Link from "next/link";
import { EventMedia } from "@/components/event-media";
import { EventMeta } from "@/components/event-meta";
import { venueLabel } from "@/lib/center";
import type { Event } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { describeRepeat } from "@/lib/recurrence";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

export async function EventCard({
  event,
  index = 0,
  className = "",
}: {
  event: Event;
  index?: number;
  className?: string;
}) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const date = formatEventDate(event.startAt, lang);
  const time = formatEventTime(event.startAt, event.endAt, lang);
  const venue = venueLabel(event.location, dict.events.atCenter);
  const repeat = describeRepeat(event, dict.events.repeat, lang);

  return (
    <div
      className={`surface-card surface-card-link group relative flex flex-col overflow-clip rounded-none p-3.5 ${className}`}
    >
      <EventMedia
        flyerUrl={event.flyerUrl}
        flyerAlt={dict.eventDetail.flyerAlt.replace("{title}", event.title)}
        description={event.description}
        index={index}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="flex flex-1 flex-col pt-3.5">
        <h3 className="line-clamp-2 font-display text-lg leading-snug text-ink group-hover:text-indigo">
          <Link
            href={localePath(lang, `/events/${event.slug}`)}
            className="card-stretch"
          >
            {event.title}
          </Link>
        </h3>
        <div className="mt-auto space-y-1.5 pt-3">
          {(date || time) && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-indigo">
              {date && <EventMeta icon="calendar">{date}</EventMeta>}
              {time && <EventMeta icon="clock">{time}</EventMeta>}
            </p>
          )}
          {repeat && (
            <p className="text-sm text-ink-soft">
              <EventMeta icon="repeat">{repeat}</EventMeta>
            </p>
          )}
          {venue && (
            <p className="text-sm text-stone">
              <EventMeta icon="pin">
                <span className="line-clamp-2">{venue}</span>
              </EventMeta>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
