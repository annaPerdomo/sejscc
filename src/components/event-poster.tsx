import Image from "next/image";
import Link from "next/link";
import { DatePage } from "@/components/date-page";
import { EventDescriptionMedia } from "@/components/event-media";
import { EventMeta } from "@/components/event-meta";
import { EventSignupLink } from "@/components/event-signup-link";
import { venueLabel } from "@/lib/center";
import type { Event } from "@/lib/events";
import {
  excerpt,
  formatEventDate,
  formatEventDay,
  formatEventMonth,
  formatEventTime,
  formatWeekday,
} from "@/lib/format";
import { getImageSize } from "@/lib/image-size";
import { describeRepeat } from "@/lib/recurrence";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

const TILTS = ["-rotate-1", "rotate-1", "rotate-0", "rotate-1", "-rotate-1", "rotate-0"];

const SIZES = {
  feature: "(max-width: 1024px) 92vw, 34rem",
  standard: "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30rem",
  compact: "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 22rem",
};

const SUMMARY_MAX_CELLS = 320;

export async function EventPoster({
  event,
  index = 0,
  badge,
  withSignup = false,
  variant = "standard",
}: {
  event: Event;
  index?: number;
  badge?: string;
  withSignup?: boolean;
  variant?: keyof typeof SIZES;
}) {
  // Only the feature is measured: a grid of archive posters would otherwise
  // fetch every flyer's header in a single render.
  const measure = variant === "feature" && event.flyerUrl;
  const [lang, dict, flyerSize] = await Promise.all([
    getLocale(),
    getDictionary(),
    measure ? getImageSize(measure) : null,
  ]);
  const href = localePath(lang, `/events/${event.slug}`);
  const month = formatEventMonth(event.startAt, lang);
  const day = formatEventDay(event.startAt, lang);
  const weekday = event.startAt ? formatWeekday(event.startAt, lang) : null;
  const time = formatEventTime(event.startAt, event.endAt, lang);
  const venue = venueLabel(event.location, dict.events.atCenter);
  const repeat = describeRepeat(event, dict.events.repeat, lang);
  const feature = variant === "feature";
  const compact = variant === "compact";
  // The feature's date page already names the weekday.
  const when = (feature ? [time] : [weekday, time]).filter(Boolean).join(" · ");

  const poster = (
    <Link
      href={href}
      tabIndex={-1}
      aria-hidden="true"
      className={`relative block transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:rotate-0 ${
        TILTS[index % TILTS.length]
      }`}
    >
      <span className="absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full bg-magenta shadow-md ring-2 ring-magenta-deep/40" />
      <div className="flyer-mount seigaiha-rings seigaiha-rings-gold">
        {event.flyerUrl && feature ? (
          <Image
            src={event.flyerUrl}
            alt=""
            width={flyerSize?.width ?? 800}
            height={flyerSize?.height ?? 1000}
            sizes={SIZES[variant]}
            className="relative h-auto w-full ring-1 ring-ink/10"
          />
        ) : event.flyerUrl ? (
          <span className="relative block aspect-flyer w-full">
            <Image
              src={event.flyerUrl}
              alt=""
              fill
              sizes={SIZES[variant]}
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

  return (
    <article
      className={`group relative ${
        feature ? "grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14" : "flex flex-col"
      }`}
    >
      <div className={feature ? "mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none" : ""}>
        {poster}
      </div>
      <div
        className={`flex items-start gap-4 ${
          feature ? "lg:col-span-7 lg:gap-6" : "mt-7"
        }`}
      >
        {month && day && (
          <DatePage
            month={month}
            day={day}
            weekday={feature ? weekday : null}
            size={feature ? "lg" : "sm"}
          />
        )}
        <div className="min-w-0 flex-1">
          {badge && (
            <span className="mb-3 inline-block rounded-xs bg-magenta px-3 py-1.5 font-display text-sm font-semibold tracking-[0.16em] text-white uppercase">
              {badge}
            </span>
          )}
          <h3
            className={`font-display leading-snug font-semibold text-ink text-pretty ${
              feature ? "text-3xl sm:text-4xl" : compact ? "text-lg" : "text-xl"
            }`}
          >
            <Link href={href} className="hover:text-indigo">
              {event.title}
            </Link>
          </h3>
          <div
            className={`mt-2 flex flex-col gap-1 text-ink-soft ${
              feature ? "text-lg" : "text-base"
            }`}
          >
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
          {feature && event.description && (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              {excerpt(event.description, SUMMARY_MAX_CELLS)}
            </p>
          )}
          {(feature || (withSignup && event.signupUrl)) && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {feature && (
                <Link
                  href={href}
                  aria-label={`${dict.events.detailsCta}: ${event.title}`}
                  className="button-primary rounded-lg px-7 py-4 font-display text-base font-semibold text-white"
                >
                  {dict.events.detailsCta}
                </Link>
              )}
              {withSignup && event.signupUrl && (
                <EventSignupLink
                  href={event.signupUrl}
                  label={dict.events.signupCta}
                  title={event.title}
                  ariaTemplate={dict.events.signupAria}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
