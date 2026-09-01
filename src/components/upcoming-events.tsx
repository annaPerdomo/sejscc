import { EventsCarousel, type CarouselEvent } from "@/components/events-carousel";
import { venueLabel } from "@/lib/center";
import type { Event } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { describeRepeat } from "@/lib/recurrence";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

export async function UpcomingEvents({ events }: { events: Event[] }) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);

  const cards: CarouselEvent[] = events.map((event) => ({
    id: event.id,
    href: localePath(lang, `/events/${event.slug}`),
    title: event.title,
    date: formatEventDate(event.startAt, lang),
    time: formatEventTime(event.startAt, event.endAt, lang),
    repeat: describeRepeat(event, dict.events.repeat, lang),
    signupUrl: event.signupUrl,
    location: venueLabel(event.location, dict.events.atCenter),
    description: event.description,
    flyerUrl: event.flyerUrl,
    flyerAlt: dict.eventDetail.flyerAlt.replace("{title}", event.title),
  }));

  return (
    <EventsCarousel
      events={cards}
      nextUpLabel={dict.home.upcomingNextUp}
      signupLabel={dict.events.signupCta}
      signupAriaLabel={dict.events.signupAria}
      prevLabel={dict.home.upcomingPrev}
      nextLabel={dict.home.upcomingNext}
      pauseLabel={dict.home.upcomingPause}
      playLabel={dict.home.upcomingPlay}
      detailsLabel={dict.home.upcomingDetails}
    />
  );
}
