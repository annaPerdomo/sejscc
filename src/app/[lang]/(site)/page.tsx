import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

export const revalidate = 300;

export default async function HomePage() {
  const [lang, dict, upcoming, groups] = await Promise.all([
    getLocale(),
    getDictionary(),
    getUpcomingEvents(3),
    getActiveGroups(),
  ]);
  const href = (path: string) => localePath(lang, path);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sand bg-cream-deep">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-medium tracking-[0.22em] text-vermilion uppercase">
            {dict.home.kicker}
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-6xl">
            {dict.home.heroTitle}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">
            {dict.home.heroText}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={href("/events")}
              className="rounded-md bg-vermilion px-6 py-3 font-semibold text-white hover:bg-vermilion-deep"
            >
              {dict.home.heroEvents}
            </Link>
            <Link
              href={href("/groups")}
              className="rounded-md border border-ink/20 px-6 py-3 font-semibold text-ink hover:bg-white"
            >
              {dict.home.heroGroups}
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-3xl text-ink">
            {dict.home.upcomingTitle}
          </h2>
          <Link
            href={href("/events")}
            className="text-sm font-semibold text-vermilion hover:text-vermilion-deep"
          >
            {dict.home.viewAll}
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
            {dict.home.noEvents}
          </p>
        )}
      </section>

      {/* Groups strip */}
      <section className="border-y border-sand bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-serif text-3xl text-ink">
            {dict.home.groupsTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-stone">{dict.home.groupsText}</p>
          {groups.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={href("/groups")}
                  className="rounded-full border border-sand bg-cream px-5 py-2.5 text-sm font-medium text-ink hover:border-vermilion hover:text-vermilion"
                >
                  {group.name}
                </Link>
              ))}
            </div>
          )}
          <Link
            href={href("/groups")}
            className="mt-8 inline-block text-sm font-semibold text-vermilion hover:text-vermilion-deep"
          >
            {dict.home.groupsCta}
          </Link>
        </div>
      </section>

      {/* Support band */}
      <section className="bg-ink">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-serif text-3xl text-white">
            {dict.home.supportTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            {dict.home.supportText}
          </p>
          <Link
            href={href("/payments") + "#donate"}
            className="mt-8 inline-block rounded-md bg-vermilion px-8 py-3 font-semibold text-white hover:bg-vermilion-deep"
          >
            {dict.home.supportCta}
          </Link>
        </div>
      </section>
    </>
  );
}
