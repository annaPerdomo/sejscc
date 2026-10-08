import Image from "next/image";
import Link from "next/link";
import { AddToCalendar } from "@/components/add-to-calendar";
import { DatePage } from "@/components/date-page";
import { EventDescriptionMedia } from "@/components/event-media";
import { EventMeta } from "@/components/event-meta";
import { EventSignupLink } from "@/components/event-signup-link";
import { calendarLinks, calendarOptions } from "@/lib/calendars";
import { venueLabel } from "@/lib/center";
import type { Event } from "@/lib/events";
import {
  formatEventDate,
  formatEventDay,
  formatEventMonth,
  formatEventTime,
  formatWeekday,
} from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";
import { getImageSize } from "@/lib/image-size";
import { describeRepeat } from "@/lib/recurrence";

const FLYER_SIZES = "(max-width: 1024px) 80vw, 26rem";

export async function NextEventDetails({ event }: { event: Event }) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const href = localePath(lang, `/events/${event.slug}`);
  const month = formatEventMonth(event.startAt, lang);
  const day = formatEventDay(event.startAt, lang);
  const weekday = event.startAt ? formatWeekday(event.startAt, lang) : null;
  const time = formatEventTime(event.startAt, event.endAt, lang);
  const venue = venueLabel(event.location, dict.events.atCenter);
  const repeat = describeRepeat(event, dict.events.repeat, lang);
  const calendar = event.startAt
    ? calendarOptions(
        calendarLinks({
          slug: event.slug,
          title: event.title,
          start: event.startAt,
          end: event.endAt,
          details: event.description,
          location: event.location,
        }),
        dict.calendar,
      )
    : null;

  return (
    <div>
      <span className="inline-block rounded-xs bg-magenta px-3 py-1.5 font-display text-sm font-semibold tracking-[0.16em] text-white uppercase">
        {dict.events.nextUpBadge}
      </span>
      <div className="mt-5 flex items-start gap-5">
        {month && day && <DatePage month={month} day={day} weekday={weekday} size="lg" />}
        <div className="min-w-0">
          <h2 className="font-display text-3xl leading-tight font-semibold text-ink text-pretty sm:text-4xl">
            <Link href={href} className="hover:text-indigo">
              {event.title}
            </Link>
          </h2>
          <div className="mt-3 flex flex-col gap-1 text-lg text-ink-soft">
            <p className="sr-only">{formatEventDate(event.startAt, lang)}</p>
            {time && (
              <p>
                <EventMeta icon="clock">{time}</EventMeta>
              </p>
            )}
            {repeat && (
              <p>
                <EventMeta icon="repeat">{repeat}</EventMeta>
              </p>
            )}
            {venue && (
              <p>
                <EventMeta icon="pin">{venue}</EventMeta>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href={href}
          aria-label={`${dict.events.detailsCta}: ${event.title}`}
          className="button-primary rounded-lg px-7 py-4 font-display text-base font-semibold text-white"
        >
          {dict.events.detailsCta}
        </Link>
        {event.signupUrl && (
          <EventSignupLink
            href={event.signupUrl}
            label={dict.events.signupCta}
            title={event.title}
            ariaTemplate={dict.events.signupAria}
          />
        )}
        {calendar && (
          <AddToCalendar
            tone="light"
            label={dict.calendar.addToCalendar}
            menuLabel={dict.calendar.chooseCalendar}
            options={calendar}
          />
        )}
      </div>
    </div>
  );
}

export async function NextEventFlyer({ event }: { event: Event }) {
  const [lang, size] = await Promise.all([
    getLocale(),
    event.flyerUrl ? getImageSize(event.flyerUrl) : null,
  ]);

  return (
    <Link
      href={localePath(lang, `/events/${event.slug}`)}
      tabIndex={-1}
      aria-hidden="true"
      className="block w-fit max-w-full transition duration-300 ease-out hover:-translate-y-1.5"
    >
      <div className="flyer-mount seigaiha-rings seigaiha-rings-gold">
        {event.flyerUrl ? (
          <Image
            src={event.flyerUrl}
            alt=""
            width={size?.width ?? 800}
            height={size?.height ?? 1000}
            preload
            sizes={FLYER_SIZES}
            className="relative h-auto max-h-hero-flyer w-auto max-w-full ring-1 ring-ink/10"
          />
        ) : (
          <EventDescriptionMedia
            description={event.description}
            index={0}
            className="relative w-80 max-w-full"
          />
        )}
      </div>
    </Link>
  );
}
