import Image from "next/image";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

export const revalidate = 300;

const pillars = [
  {
    key: "community",
    color: "bg-ink",
    icon: (
      <g>
        <circle cx="12" cy="13" r="3.2" />
        <circle cx="20" cy="13" r="3.2" />
        <circle cx="28" cy="13" r="3.2" />
        <path d="M6.5 27c0-3.2 2.4-5.5 5.5-5.5S17.5 23.8 17.5 27" />
        <path d="M14.5 27c0-3.2 2.4-5.5 5.5-5.5s5.5 2.3 5.5 5.5" />
        <path d="M22.5 27c0-3.2 2.4-5.5 5.5-5.5s5.5 2.3 5.5 5.5" />
      </g>
    ),
  },
  {
    key: "education",
    color: "bg-vermilion",
    icon: (
      <g>
        <path d="M20 12c-2.5-2-6.5-2.5-10-2.5v18c3.5 0 7.5.5 10 2.5 2.5-2 6.5-2.5 10-2.5v-18c-3.5 0-7.5.5-10 2.5Z" />
        <path d="M20 12v18" />
      </g>
    ),
  },
  {
    key: "culture",
    color: "bg-pine",
    icon: (
      <g>
        <path d="M7.5 12.5c8.5-3 16.5-3 25 0" />
        <path d="M13 29.5V13M27 29.5V13" />
        <path d="M10.5 18.5h19" />
        <path d="M20 18.5v-6.7" />
      </g>
    ),
  },
  {
    key: "sports",
    color: "bg-gold",
    icon: (
      <g>
        <circle cx="20" cy="20" r="10.5" />
        <path d="M20 9.5v21M9.5 20h21" />
        <path d="M12.6 12.8c2 1.8 3.2 4.4 3.2 7.2s-1.2 5.4-3.2 7.2M27.4 12.8c-2 1.8-3.2 4.4-3.2 7.2s1.2 5.4 3.2 7.2" />
      </g>
    ),
  },
] as const;

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
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-vermilion uppercase">
              {dict.home.kicker}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
              {dict.home.heroTitle}
            </h1>
            <div className="mt-6 h-1 w-16 rounded-full bg-vermilion" />
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
                className="rounded-md border border-ink/25 px-6 py-3 font-semibold text-ink hover:border-ink hover:bg-mist"
              >
                {dict.home.heroGroups}
              </Link>
            </div>
          </div>
          <PhotoPlaceholder
            label={dict.home.photoSoon}
            className="aspect-[4/3] w-full"
          />
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
          <p className="mt-8 rounded-2xl border border-line bg-mist p-8 text-stone">
            {dict.home.noEvents}
          </p>
        )}
      </section>

      {/* Mission */}
      <section className="border-t border-line bg-mist">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-md">
            <p className="text-sm font-semibold tracking-[0.22em] text-vermilion uppercase">
              {dict.home.missionKicker}
            </p>
            <p className="mt-4 font-serif text-xl leading-relaxed text-ink">
              {dict.home.missionText}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-4 lg:gap-x-12">
            {pillars.map((pillar) => (
              <div key={pillar.key} className="flex w-24 flex-col items-center text-center sm:w-28">
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-white ${pillar.color}`}
                >
                  <svg
                    viewBox="0 0 40 40"
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {pillar.icon}
                  </svg>
                </span>
                <p className="mt-3 text-sm font-medium leading-snug text-ink">
                  {dict.home.missionPillars[pillar.key]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Groups & programs */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <p className="text-sm font-semibold tracking-[0.22em] text-vermilion uppercase">
            {dict.home.groupsKicker}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">
            {dict.home.groupsTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-stone">
            {dict.home.groupsText}
          </p>
          {groups.length > 0 && (
            <div className="mt-10 grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={href("/groups")}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative flex aspect-[16/9] items-center justify-center bg-mist">
                    {group.imageUrl ? (
                      <Image
                        src={group.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="/logo-mark.png"
                        alt=""
                        width={64}
                        height={64}
                        className="opacity-10"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-serif text-xl text-ink group-hover:text-vermilion">
                      {group.name}
                    </h3>
                    {group.meetingSchedule && (
                      <p className="mt-1 text-sm font-medium text-vermilion">
                        {group.meetingSchedule}
                      </p>
                    )}
                    {group.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone">
                        {group.description}
                      </p>
                    )}
                    <span
                      aria-hidden="true"
                      className="mt-4 text-vermilion transition group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link
            href={href("/groups")}
            className="mt-10 inline-block rounded-md bg-ink px-6 py-3 text-sm font-semibold tracking-[0.08em] text-white uppercase hover:bg-ink-soft"
          >
            {dict.home.groupsButton}
          </Link>
        </div>
      </section>

      {/* Support band */}
      <section className="bg-ink">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-gold uppercase">
              {dict.home.supportKicker}
            </p>
            <h2 className="mt-4 font-serif text-3xl text-white sm:text-4xl">
              {dict.home.supportTitle}
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-white/70">
              {dict.home.supportText}
            </p>
            <Link
              href={href("/payments") + "#donate"}
              className="mt-8 inline-block rounded-md bg-vermilion px-8 py-3 font-semibold text-white hover:bg-vermilion-deep"
            >
              {dict.home.supportCta}
            </Link>
          </div>
          <PhotoPlaceholder
            label={dict.home.photoSoon}
            dark
            className="aspect-[4/3] w-full"
          />
        </div>
      </section>
    </>
  );
}
