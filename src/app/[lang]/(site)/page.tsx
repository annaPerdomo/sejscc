import Image from "next/image";
import Link from "next/link";
import { BambooGrove } from "@/components/bamboo-grove";
import { BrushEdge } from "@/components/brush-edge";
import { HeroCarousel, type HeroTab } from "@/components/hero-carousel";
import { EventsCarousel, type CarouselEvent } from "@/components/events-carousel";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { WaveDivider } from "@/components/wave-divider";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

export const revalidate = 300;

const HERO_LINKS: Record<
  string,
  { primary: (href: (p: string) => string) => string; secondary?: (href: (p: string) => string) => string }
> = {
  center: {
    primary: (href) => href("/events"),
    secondary: (href) => href("/groups"),
  },
  school: {
    primary: (href) => href("/school"),
    secondary: (href) => href("/groups"),
  },
  clubs: {
    primary: (href) => href("/groups"),
  },
  about: {
    primary: (href) => href("/") + "#connect",
  },
  donate: {
    primary: (href) => href("/payments") + "#donate",
  },
};

export default async function HomePage() {
  const [lang, dict, upcoming, groups] = await Promise.all([
    getLocale(),
    getDictionary(),
    getUpcomingEvents(8),
    getActiveGroups(),
  ]);
  const href = (path: string) => localePath(lang, path);

  const heroTabs: HeroTab[] = dict.home.heroTabs.map((tab) => {
    const links = HERO_LINKS[tab.id];
    return {
      id: tab.id,
      tabLabel: tab.tabLabel,
      tabLabelAccent: tab.tabLabelAccent,
      kickerAccent: tab.kickerAccent,
      kickerCaption: tab.kickerCaption,
      headingLine1: tab.headingLine1,
      headingLine2: tab.headingLine2,
      body: tab.body,
      primaryCta: { label: tab.primaryCta, href: links.primary(href) },
      secondaryCta:
        "secondaryCta" in tab && tab.secondaryCta && links.secondary
          ? { label: tab.secondaryCta, href: links.secondary(href) }
          : undefined,
      photoSrc: tab.id === "center" ? "/campus-hero.jpg" : undefined,
      photoAlt: tab.id === "center" ? dict.home.campusPhotoAlt : undefined,
      placeholderLabel: dict.home.photoSoon,
    };
  });

  const carouselEvents: CarouselEvent[] = upcoming.map((event) => ({
    id: event.id,
    href: href(`/events/${event.slug}`),
    title: event.title,
    date: formatEventDate(event.startAt, lang),
    time: formatEventTime(event.startAt, event.endAt, lang),
    location: event.location,
    description: event.description,
    flyerUrl: event.flyerUrl,
    flyerAlt: dict.eventDetail.flyerAlt.replace("{title}", event.title),
  }));

  return (
    <>
      <HeroCarousel tabs={heroTabs} tabsLabel={dict.home.heroTabsLabel} />

      <section className="section-wash-events relative overflow-clip pt-14 pb-16 sm:pt-16">
        <BambooGrove />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal-rise mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionKicker
                accent={dict.home.upcomingKickerAccent}
                caption={dict.home.upcomingKickerCaption}
              />
              <SectionHeading className="mt-3">
                {dict.home.upcomingTitle}
              </SectionHeading>
            </div>
            <Link
              href={href("/events")}
              className="font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
            >
              {dict.home.viewAll}
            </Link>
          </div>
          {carouselEvents.length > 0 ? (
            <EventsCarousel
              events={carouselEvents}
              nextUpLabel={dict.home.upcomingNextUp}
              prevLabel={dict.home.upcomingPrev}
              nextLabel={dict.home.upcomingNext}
              detailsLabel={dict.home.upcomingDetails}
            />
          ) : (
            <p className="rounded-2xl border border-line bg-mist p-8 text-ink-soft">
              {dict.home.noEvents}
            </p>
          )}
        </div>
      </section>

      <section id="school" className="section-navy-scene relative scroll-mt-28 overflow-clip text-white">
        <KanjiWatermark char="学" className="-top-14 -left-10 text-white/5" />
        <WaveDivider id="school-top" position="top" seed={12} className="relative text-white" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-6 pb-8 sm:px-6 sm:pb-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="reveal-rise">
            <span className="block font-display text-xs font-semibold tracking-[0.24em] text-sky uppercase">
              {dict.home.japaneseSchool.kicker}
            </span>
            <span className="mt-5 mb-5 block h-0.5 w-9 bg-indigo" />
            <h2 className="font-display text-3xl leading-snug font-normal tracking-[0.02em] sm:text-4xl">
              <span className="block text-white">{dict.home.japaneseSchool.headingLine1}</span>
              <span className="block text-sky">{dict.home.japaneseSchool.headingLine2}</span>
            </h2>
            <p className="mt-4 font-display text-lg font-semibold text-sky">
              {dict.home.japaneseSchool.subheading}
            </p>
            <p className="mt-5 max-w-lg leading-relaxed text-white/75">
              {dict.home.japaneseSchool.body}
            </p>
          </div>
          <div className="reveal-rise relative mx-auto aspect-square w-64 sm:w-80 lg:-mr-6 lg:w-120">
            <PhotoPlaceholder
              dark
              shape="circle"
              label={dict.home.japaneseSchool.photoLabel}
              className="h-full w-full"
            />
            <svg
              viewBox="0 0 640 640"
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 overflow-visible sm:-inset-6"
            >
              <defs>
                <filter id="enso-a" x="-30%" y="-30%" width="160%" height="160%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.045"
                    numOctaves="4"
                    seed="11"
                    result="n"
                  />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="10" />
                </filter>
                <filter id="enso-b" x="-30%" y="-30%" width="160%" height="160%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.11"
                    numOctaves="3"
                    seed="4"
                    result="n"
                  />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale="8" />
                </filter>
              </defs>
              <g transform="rotate(118 320 320)">
                <circle
                  cx="320"
                  cy="320"
                  r="311"
                  fill="none"
                  className="stroke-sand/70"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="794 1161"
                  opacity="0.9"
                  filter="url(#enso-a)"
                />
                <circle
                  cx="320"
                  cy="320"
                  r="319"
                  fill="none"
                  className="stroke-sand/50"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="56 20 166 28 460 1223"
                  strokeDashoffset="77"
                  opacity="0.55"
                  filter="url(#enso-b)"
                />
              </g>
              <g transform="rotate(-52 320 320)">
                <circle
                  cx="320"
                  cy="320"
                  r="314"
                  fill="none"
                  className="stroke-sand/40"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="294 1660"
                  opacity="0.6"
                  filter="url(#enso-b)"
                />
              </g>
            </svg>
          </div>
        </div>
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 pb-4 sm:grid-cols-4 sm:px-6">
          {dict.home.japaneseSchool.highlights.map((item, i) => (
            <div
              key={i}
              className="reveal-rise flex flex-col items-start border-t border-white/15 pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8 sm:first:border-l-0 sm:first:pl-0"
            >
              <PhotoPlaceholder
                dark
                shape="circle"
                label={dict.home.photoSoon}
                className="h-28 w-28"
              />
              <span className="mt-5 block h-0.5 w-8 bg-indigo" />
              <span className="mt-3.5 font-display text-lg leading-tight font-semibold text-white">
                {item.title}
              </span>
              <span className="mt-2.5 text-sm leading-relaxed text-white/70">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-wrap gap-3 px-4 pt-8 pb-16 sm:px-6 sm:pb-20">
          <Link
            href={`${href("/school")}#tuition`}
            className="button-primary rounded-lg px-7 py-3.5 font-display text-sm font-semibold text-white"
          >
            {dict.home.japaneseSchool.primaryCta}
          </Link>
          <Link
            href={href("/groups")}
            className="rounded-lg border-2 border-white/50 px-7 py-3 font-display text-sm font-semibold text-white hover:border-white hover:bg-white/10"
          >
            {dict.home.japaneseSchool.secondaryCta}
          </Link>
        </div>
        <BrushEdge id="school-bottom" variant="ink" className="absolute inset-x-0 bottom-0" />
      </section>

      <section className="section-wash-groups seigaiha-rings">
        <KanjiWatermark
          char="輪"
          className="-right-10 -bottom-16 text-indigo/5"
        />
        <BrushEdge id="clubs-bottom" variant="paper" className="absolute inset-x-0 bottom-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="reveal-rise mb-10 text-center">
            <SectionKicker
              accent={dict.home.sportsClubs.kickerAccent}
              caption={dict.home.sportsClubs.kickerCaption}
              className="mb-3.5 justify-center"
            />
            <SectionHeading>
              <span className="text-indigo">
                {dict.home.sportsClubs.headingLine1}
              </span>{" "}
              {dict.home.sportsClubs.headingLine2}
            </SectionHeading>
            <p className="mx-auto mt-3.5 max-w-2xl text-ink-soft">
              {dict.home.sportsClubs.body}
            </p>
          </div>
          {groups.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="surface-card surface-card-link reveal-rise group flex flex-col overflow-hidden"
                >
                  {group.imageUrl ? (
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image
                        src={group.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <PhotoPlaceholder
                      label={dict.home.sportsClubs.photoLabel}
                      frame={false}
                      className="h-44 w-full"
                    />
                  )}
                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <span className="font-display text-lg font-semibold text-ink">
                      {group.name}
                    </span>
                    {group.meetingSchedule && (
                      <span className="text-sm text-ink-soft">{group.meetingSchedule}</span>
                    )}
                    {group.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                        {group.description}
                      </p>
                    )}
                    <Link
                      href={group.websiteUrl ?? href("/groups")}
                      className="mt-auto pt-3 font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
                    >
                      {dict.groups.website}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-line bg-white p-8 text-center text-ink-soft">
              {dict.home.sportsClubs.empty}
            </p>
          )}
          <div className="mt-11 text-center">
            <Link
              href={href("/groups")}
              className="button-primary inline-block rounded-lg px-7 py-3 font-display text-sm font-semibold text-white"
            >
              {dict.home.sportsClubs.cta}
            </Link>
          </div>
        </div>
      </section>

      <section className="section-wash-history relative overflow-clip">
        <KanjiWatermark char="和" className="-bottom-10 left-4 text-ink/5" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div className="reveal-rise">
            <SectionKicker
              accent={dict.home.history.kickerAccent}
              caption={dict.home.history.kickerCaption}
              tone="magenta"
              order="caption-first"
            />
            <h2 className="mt-5 font-display text-3xl leading-snug font-normal tracking-[0.02em]">
              <span className="text-ink">{dict.home.history.headingLine1}</span>
              <br />
              <span className="text-magenta">{dict.home.history.headingLine2}</span>
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-soft">{dict.home.history.body}</p>
            <div className="relative mt-9 flex flex-col gap-6">
              <span className="absolute top-1.5 bottom-1.5 left-1.5 w-px bg-line" />
              {dict.home.history.milestones.map((step) => (
                <div key={step.year} className="relative flex items-start gap-4 pl-0">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-magenta ring-4 ring-magenta/15" />
                  <div>
                    <p className="font-display text-sm font-bold tracking-[0.05em] text-ink">
                      {step.year}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <PhotoPlaceholder
            label={dict.home.history.photoLabel}
            className="reveal-rise aspect-[4/3] w-full lg:-rotate-2"
          />
        </div>
      </section>

      <section id="connect" className="section-wash-connect relative grid scroll-mt-16 md:grid-cols-2">
        <WaveDivider
          id="connect-top"
          position="top"
          accent="magenta"
          seed={27}
          className="absolute inset-x-0 top-0 z-10 text-paper"
        />
        <PhotoPlaceholder
          label={dict.home.connectPhotoLabel}
          frame={false}
          className="min-h-64 w-full"
        />
        <div className="reveal-rise relative flex flex-col justify-center overflow-clip px-6 py-14 sm:px-10 md:pt-32 md:pb-20 lg:px-14 lg:pt-44 lg:pb-28">
          <KanjiWatermark char="絆" className="-top-4 -right-6 text-indigo/5" />
          <SectionKicker
            accent={dict.home.connectKickerAccent}
            caption={dict.home.connectKickerCaption}
            tone="magenta"
            order="caption-first"
          />
          <h2 className="mt-4 font-display text-2xl leading-snug font-normal tracking-[0.02em] text-ink sm:text-3xl">
            {dict.home.connectTitle}
          </h2>
          <p className="mt-4 max-w-lg leading-relaxed text-ink-soft">
            {dict.home.connectText}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="tel:+15628635996"
              className="button-primary rounded-lg px-5 py-2.5 font-display text-sm font-semibold text-white"
            >
              {dict.home.connectCall}
            </a>
            <a
              href="mailto:info@sejscc.org"
              className="rounded-lg border-2 border-ink/20 px-5 py-2.5 font-display text-sm font-semibold text-ink hover:border-ink"
            >
              {dict.home.connectEmail}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
