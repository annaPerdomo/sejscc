import {
  EventsHeroCarousel,
  type EventsHeroItem,
} from "@/components/events-hero-carousel";
import { WaveDivider } from "@/components/wave-divider";
import { calendarLinks, calendarOptions } from "@/lib/calendars";
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
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";
import { getImageSize } from "@/lib/image-size";
import { homePhotos } from "@/lib/photos";
import { describeRepeat } from "@/lib/recurrence";

// Half-width cells; three lines beside the flyer at the widest the column gets.
const SUMMARY_MAX_CELLS = 220;

export async function EventsHero({ events }: { events: Event[] }) {
  const [lang, dict, flyerSizes] = await Promise.all([
    getLocale(),
    getDictionary(),
    Promise.all(
      events.map((event) =>
        event.flyerUrl ? getImageSize(event.flyerUrl) : null,
      ),
    ),
  ]);
  const copy = dict.home.eventsHero;

  const items: EventsHeroItem[] = events.map((event, i) => ({
    id: event.id,
    title: event.title,
    href: localePath(lang, `/events/${event.slug}`),
    date: formatEventDate(event.startAt, lang),
    weekday: event.startAt ? formatWeekday(event.startAt, lang) : null,
    month: formatEventMonth(event.startAt, lang),
    day: formatEventDay(event.startAt, lang),
    time: formatEventTime(event.startAt, event.endAt, lang),
    venue: venueLabel(event.location, dict.events.atCenter),
    repeat: describeRepeat(event, dict.events.repeat, lang),
    // Without a flyer the description already fills the frame.
    summary:
      event.flyerUrl && event.description
        ? excerpt(event.description, SUMMARY_MAX_CELLS)
        : null,
    calendar: event.startAt
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
      : null,
    description: event.description,
    flyerUrl: event.flyerUrl,
    flyerSize: flyerSizes[i],
    flyerAlt: dict.eventDetail.flyerAlt.replace("{title}", event.title),
  }));

  return (
    <section className="edge-flush relative overflow-clip bg-navy">
      <EventsHeroCarousel
        items={items}
        backdropSrc={homePhotos.eventsBackdrop}
        viewAllHref={localePath(lang, "/events")}
        labels={{
          kickerAccent: copy.kickerAccent,
          kickerCaption: copy.kickerCaption,
          headingLine1: copy.headingLine1,
          headingLine2: copy.headingLine2,
          empty: dict.home.noEvents,
          viewAll: dict.home.viewAll,
          next: copy.nextLabel,
          upcoming: copy.upcomingLabel,
          date: dict.eventDetail.date,
          time: dict.eventDetail.time,
          where: dict.eventDetail.where,
          repeats: dict.eventDetail.repeats,
          details: copy.detailsCta,
          addToCalendar: dict.calendar.addToCalendar,
          chooseCalendar: dict.calendar.chooseCalendar,
          panelTitle: copy.panelTitle,
          list: copy.listLabel,
          pause: dict.home.upcomingPause,
          play: dict.home.upcomingPlay,
        }}
      />
      <WaveDivider id="hero" seed={3} className="absolute inset-x-0 bottom-0 text-paper" />
    </section>
  );
}
