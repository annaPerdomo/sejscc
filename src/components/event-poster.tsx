import Image from "next/image";
import Link from "next/link";
import { DatePage } from "@/components/date-page";
import { EventDescriptionMedia } from "@/components/event-media";
import { EventMeta } from "@/components/event-meta";
import { EventSignupLink } from "@/components/event-signup-link";
import { venueLabel } from "@/lib/center";
import type { Event } from "@/lib/events";
import {
  formatEventDate,
  formatEventDay,
  formatEventMonth,
  formatEventTime,
  formatWeekday,
} from "@/lib/format";
import { describeRepeat } from "@/lib/recurrence";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

const FLYER_SIZES = "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 22rem";

export async function EventPoster({
  event,
  index = 0,
  withSignup = false,
  variant = "standard",
}: {
  event: Event;
  index?: number;
  withSignup?: boolean;
  variant?: "standard" | "compact";
}) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const href = localePath(lang, `/events/${event.slug}`);
  const month = formatEventMonth(event.startAt, lang);
  const day = formatEventDay(event.startAt, lang);
  const weekday = event.startAt ? formatWeekday(event.startAt, lang) : null;
  const time = formatEventTime(event.startAt, event.endAt, lang);
  const venue = venueLabel(event.location, dict.events.atCenter);
  const repeat = describeRepeat(event, dict.events.repeat, lang);
  const compact = variant === "compact";
  const when = [weekday, time].filter(Boolean).join(" · ");

  const poster = (
    <Link
      href={href}
      tabIndex={-1}
      aria-hidden="true"
      className="relative block transition duration-300 ease-out group-hover:-translate-y-1.5"
    >
      <div className="flyer-mount seigaiha-rings seigaiha-rings-gold">
        {event.flyerUrl ? (
          <span className="relative block aspect-flyer w-full">
            <Image
              src={event.flyerUrl}
              alt=""
              fill
              sizes={FLYER_SIZES}
              className={`object-contain ${compact ? "photo-develop" : ""}`}
            />
          </span>
        ) : (
          <EventDescriptionMedia
            description={event.description}
            index={index}
            className="relative"
          />
        )}
      </div>
    </Link>
  );

  const details = (
    <div className="flex items-start gap-4">
      {month && day && <DatePage month={month} day={day} size="sm" />}
      <div className="min-w-0 flex-1">
        <h3
          className={`font-display leading-snug font-semibold text-ink text-pretty ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          <Link href={href} className="hover:text-indigo">
            {event.title}
          </Link>
        </h3>
        <div className="mt-2 flex flex-col gap-1 text-base text-ink-soft">
          <p className="sr-only">{formatEventDate(event.startAt, lang)}</p>
          {when && (
            <p>
              <EventMeta icon="clock">{when}</EventMeta>
            </p>
          )}
          {repeat && (
            <p>
              <EventMeta icon="repeat">{repeat}</EventMeta>
            </p>
          )}
          {venue && !compact && (
            <p>
              <EventMeta icon="pin">{venue}</EventMeta>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <article className="group relative flex flex-col gap-6">
      {compact ? (
        <>
          {poster}
          {details}
        </>
      ) : (
        <>
          {details}
          {poster}
        </>
      )}
      {withSignup && event.signupUrl && (
        <EventSignupLink
          href={event.signupUrl}
          label={dict.events.signupCta}
          title={event.title}
          ariaTemplate={dict.events.signupAria}
        />
      )}
    </article>
  );
}
