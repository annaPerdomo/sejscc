import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";

export const revalidate = 300;

export default async function HomePage() {
  const [upcoming, groups] = await Promise.all([
    getUpcomingEvents(3),
    getActiveGroups(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sand bg-cream-deep">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-medium tracking-[0.22em] text-vermilion uppercase">
            Norwalk, California
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-6xl">
            A home for Japanese culture and community.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">
            For generations, the Southeast Japanese School &amp; Community
            Center has brought neighbors together through language, arts,
            sports, and celebration. Everyone is welcome.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="rounded-md bg-vermilion px-6 py-3 font-semibold text-white hover:bg-vermilion-deep"
            >
              Upcoming Events
            </Link>
            <Link
              href="/groups"
              className="rounded-md border border-ink/20 px-6 py-3 font-semibold text-ink hover:bg-white"
            >
              Groups &amp; Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-3xl text-ink">Upcoming Events</h2>
          <Link
            href="/events"
            className="text-sm font-semibold text-vermilion hover:text-vermilion-deep"
          >
            View all →
          </Link>
        </div>
        {upcoming.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-xl border border-sand bg-white p-8 text-stone">
            New events are being planned — check back soon, or call the center
            at (562) 863-5996.
          </p>
        )}
      </section>

      {/* Groups strip */}
      <section className="border-y border-sand bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-3xl text-ink">
            One Center, Many Communities
          </h2>
          <p className="mt-3 max-w-2xl text-stone">
            The center is home to Japanese language school, judo, basketball,
            and cultural groups that meet here year-round.
          </p>
          {groups.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href="/groups"
                  className="rounded-full border border-sand bg-cream px-5 py-2.5 text-sm font-medium text-ink hover:border-vermilion hover:text-vermilion"
                >
                  {group.name}
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/groups"
            className="mt-8 inline-block text-sm font-semibold text-vermilion hover:text-vermilion-deep"
          >
            Explore all groups &amp; programs →
          </Link>
        </div>
      </section>

      {/* Support band */}
      <section className="bg-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-serif text-3xl text-white">
            Keep the Center Thriving
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Donations and dues keep our doors open for the next generation.
            Every gift, large or small, makes a difference.
          </p>
          <Link
            href="/payments#donate"
            className="mt-8 inline-block rounded-md bg-vermilion px-8 py-3 font-semibold text-white hover:bg-vermilion-deep"
          >
            Donate or Pay Dues
          </Link>
        </div>
      </section>
    </>
  );
}
