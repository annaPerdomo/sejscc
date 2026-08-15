import type { Metadata } from "next";
import { EventCard } from "@/components/event-card";
import { getPastEvents, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getDictionaryFor } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.events.metaTitle,
    description: dict.events.metaDescription,
    alternates: {
      canonical: localePath(lang, "/events"),
      languages: {
        en: "/events",
        ja: "/ja/events",
        "x-default": "/events",
      },
    },
  };
}

export default async function EventsPage() {
  const [dict, upcoming, past] = await Promise.all([
    getDictionary(),
    getUpcomingEvents(),
    getPastEvents(6),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-ink">{dict.events.title}</h1>
      <p className="mt-3 max-w-2xl text-stone">{dict.events.lede}</p>

      {upcoming.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-sand bg-white p-8 text-stone">
          {dict.events.empty}
        </p>
      )}

      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl text-ink">
            {dict.events.pastTitle}
          </h2>
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
