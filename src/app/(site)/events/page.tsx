import type { Metadata } from "next";
import { EventCard } from "@/components/event-card";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming events at the Southeast Japanese School & Community Center in Norwalk, CA.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(6),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-ink">Events</h1>
      <p className="mt-3 max-w-2xl text-stone">
        Festivals, fundraisers, bingo nights, and more — hosted by the center
        and the groups that call it home.
      </p>

      {upcoming.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-sand bg-white p-8 text-stone">
          No upcoming events are posted right now. Check back soon, or call the
          center at (562) 863-5996.
        </p>
      )}

      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-ink">Past Events</h2>
          <div className="mt-6 grid gap-6 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
