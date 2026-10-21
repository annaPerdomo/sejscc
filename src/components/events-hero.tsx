import Image from "next/image";
import Link from "next/link";
import { DatePage } from "@/components/date-page";
import { ExternalLink } from "@/components/external-link";
import type { Event } from "@/lib/events";
import {
  formatEventDay,
  formatEventMonth,
  formatEventTime,
  formatShortEventDate,
} from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";

export async function EventsHero({ events }: { events: Event[] }) {
  const [lang, dict, photos] = await Promise.all([
    getLocale(),
    getDictionary(),
    getSitePhotos(),
  ]);
  const copy = dict.home.eventsHero;
  const welcome = dict.home.welcome;
  const photo = slotPhoto(photos, "home.events-backdrop", copy.photoAlt, lang);

  return (
    <section className="relative isolate overflow-clip bg-navy lg:flex lg:min-h-page-hero">
      <div className="relative aspect-photo lg:absolute lg:inset-0 lg:-z-10 lg:aspect-auto">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="hero-intro-photo object-cover object-right"
        />
      </div>
      {/* Over the white building, white text keeps AA down to a 70% wash;
          sky and blossom text would need 90%, so the words here stay white. */}
      <div
        aria-hidden="true"
        className="hero-intro-scrim absolute inset-0 -z-10 hidden bg-gradient-to-r from-ink-deep/85 via-navy/75 via-50% to-transparent to-58% lg:block"
      />

      <div className="hero-intro flex-1 px-5 pt-8 pb-12 sm:px-10 sm:pt-10 lg:flex lg:px-11 lg:py-4 lg:tall:py-6 lg:taller:py-12">
        <div className="flex flex-col justify-center lg:w-1/2">
          <div className="enter-rise">
            <p
              lang={lang === "ja" ? "en" : "ja"}
              className={
                lang === "ja"
                  ? "font-display text-base font-semibold tracking-[0.3em] text-sky uppercase"
                  : "font-accent text-xl font-bold tracking-[0.3em] text-sky"
              }
            >
              {welcome.kicker}
            </p>
            <h1 className="mt-1 font-display text-4xl leading-tight font-light tracking-[0.02em] text-balance text-white sm:text-6xl lg:text-4xl lg:leading-none lg:tall:text-5xl lg:tall:leading-tight xl:taller:text-6xl">
              {welcome.heading}
            </h1>
          </div>

          <div className="hero-intro-follow enter-stagger">
            <h2 className="sr-only">{copy.panelTitle}</h2>
            {events.length > 0 && (
              <Link
                href={localePath(lang, "/events")}
                className="link-arrow mt-8 inline-block py-1 font-display text-lg font-semibold tracking-[0.06em] text-white decoration-sky decoration-2 underline-offset-4 hover:underline lg:mt-3 lg:tall:mt-6"
              >
                {dict.home.viewAll}
              </Link>
            )}
            {events.length === 0 ? (
              <p className="mt-4 text-xl leading-relaxed text-white/90">
                {dict.home.noEvents}
              </p>
            ) : (
              <ul className="mt-4 lg:mt-2 lg:tall:mt-4">
                {events.map((event) => {
                  const date = formatShortEventDate(event.startAt, lang);
                  const time = formatEventTime(event.startAt, event.endAt, lang);
                  const flyerHref = event.flyerDownloadUrl ?? event.flyerUrl;
                  const month = formatEventMonth(event.startAt, lang);
                  const day = formatEventDay(event.startAt, lang);
                  return (
                    <li
                      key={event.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 border-t border-gold/70 py-3 lg:py-1.5 lg:tall:py-2 lg:taller:py-3"
                    >
                      {event.flyerUrl && flyerHref ? (
                        <a
                          href={flyerHref}
                          target="_blank"
                          rel="noreferrer"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="relative aspect-flyer w-16 overflow-clip rounded-xs border-2 border-white bg-cream shadow-lg shadow-ink-deep/50 transition-transform duration-300 ease-out hover:-rotate-2 hover:scale-105 lg:w-12 lg:taller:w-16"
                        >
                          <Image
                            src={event.flyerUrl}
                            alt=""
                            fill
                            sizes="5rem"
                            className="object-cover object-top"
                          />
                        </a>
                      ) : (
                        month &&
                        day && (
                          <DatePage
                            month={month}
                            day={day}
                            className="lg:w-12 lg:taller:w-16"
                          />
                        )
                      )}
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-display text-xl leading-snug font-semibold text-pretty text-white lg:text-lg lg:tall:text-xl xl:line-clamp-1">
                          <ExternalLink
                            href={flyerHref ?? localePath(lang, `/events/${event.slug}`)}
                            aria-label={
                              flyerHref
                                ? copy.flyerAria.replace("{title}", event.title)
                                : undefined
                            }
                            className="underline decoration-sky/70 decoration-2 underline-offset-4 transition-colors hover:decoration-gold hover:decoration-4 focus-visible:decoration-gold focus-visible:decoration-4"
                          >
                            {event.title}
                          </ExternalLink>
                        </h3>
                        {(date || time) && (
                          <p className="mt-0.5 font-display text-base font-semibold text-white lg:taller:text-lg">
                            {[date, time].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
