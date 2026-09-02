import { EventCard } from "@/components/event-card";
import { EventsCarousel } from "@/components/events-carousel";
import type { Event } from "@/lib/events";
import { getDictionary } from "@/lib/dictionaries";

export async function UpcomingEvents({ events }: { events: Event[] }) {
  const dict = await getDictionary();

  return (
    <EventsCarousel
      prevLabel={dict.home.upcomingPrev}
      nextLabel={dict.home.upcomingNext}
      pauseLabel={dict.home.upcomingPause}
      playLabel={dict.home.upcomingPlay}
    >
      {events.map((event, i) => (
        <EventCard
          key={event.id}
          event={event}
          index={i}
          badge={i === 0 ? dict.events.nextUpBadge : undefined}
          withSignup
          className={`snap-start ${i === 0 ? "border-2 border-indigo" : ""}`}
        />
      ))}
    </EventsCarousel>
  );
}
