import Image from "next/image";
import Link from "next/link";
import { BambooGrove } from "@/components/bamboo-grove";
import { BrushEdge } from "@/components/brush-edge";
import { HeroCarousel, type HeroTab } from "@/components/hero-carousel";
import { GroupCard } from "@/components/group-card";
import { HistoryTimeline, type Milestone } from "@/components/history-timeline";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { SitePhoto } from "@/components/site-photo";
import { SiteVideo } from "@/components/site-video";
import { UpcomingEvents } from "@/components/upcoming-events";
import { WaveDivider } from "@/components/wave-divider";
import { KanjiWatermark } from "@/components/kanji-watermark";
import {
  CENTER_ADDRESS,
  CENTER_EMAIL,
  CENTER_PHONE,
  CENTER_PHONE_HREF,
  mapsEmbedUrl,
  mapsUrl,
} from "@/lib/center";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";
import { getAboutVideoUrls } from "@/lib/site-settings";
import { youtubeVideoId } from "@/lib/video";
import {
  historyMilestonePhotos,
  homeHeroPhotos,
  homePhotos,
  photoFor,
} from "@/lib/photos";

export const revalidate = 300;

const CONTACT_ICONS = {
  pin: (
    <>
      <path d="M12 21c4.2-4 6.3-7.2 6.3-9.8a6.3 6.3 0 1 0-12.6 0C5.7 13.8 7.8 17 12 21Z" />
      <circle cx="12" cy="11" r="2.4" />
    </>
  ),
  phone: (
    <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1v3.4c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.3c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z" />
  ),
  mail: (
    <>
      <rect x="3.25" y="5.5" width="17.5" height="13" rx="2.5" />
      <path d="M4 7.25 12 13l8-5.75" />
    </>
  ),
} as const;

function ContactIcon({ name }: { name: keyof typeof CONTACT_ICONS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-6 w-6 shrink-0 text-magenta"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {CONTACT_ICONS[name]}
    </svg>
  );
}

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
    primary: (href) => href("/") + "#about",
  },
  donate: {
    primary: (href) => href("/payments") + "#donate",
  },
};

export default async function HomePage() {
  const [lang, dict, upcoming, groups, aboutVideoUrls] = await Promise.all([
    getLocale(),
    getDictionary(),
    getUpcomingEvents(8),
    getActiveGroups(),
    getAboutVideoUrls(),
  ]);
  const href = (path: string) => localePath(lang, path);
  const aboutVideoIds = aboutVideoUrls
    .map((url) => youtubeVideoId(url))
    .filter((id): id is string => id !== null);

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
      photoSrc: homeHeroPhotos[tab.id],
      photoAlt: tab.photoAlt,
      placeholderLabel: dict.home.photoSoon,
    };
  });

  const milestones: Milestone[] = dict.home.history.milestones.map((step) => {
    const image = historyMilestonePhotos[step.id];
    return {
      year: step.year,
      text: step.text,
      photo: image ? { image, alt: step.photoAlt } : undefined,
    };
  });

  return (
    <>
      <HeroCarousel
        tabs={heroTabs}
        tabsLabel={dict.home.heroTabsLabel}
        pauseLabel={dict.home.heroPause}
        playLabel={dict.home.heroPlay}
      />

      <section className="section-wash-events relative z-10 pt-2 pb-12">
        <BambooGrove />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal-rise mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionKicker
                accent={dict.home.upcomingKickerAccent}
                caption={dict.home.upcomingKickerCaption}
              />
              <SectionHeading className="mt-2">
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
        </div>
        <div
          className={`relative mx-auto px-4 sm:px-6 ${
            upcoming.length > 0 ? "max-w-6xl 2xl:max-w-wide" : "max-w-6xl"
          }`}
        >
          {upcoming.length > 0 ? (
            <UpcomingEvents events={upcoming} />
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
          <div className="reveal-rise relative mx-auto aspect-square w-72 sm:w-96 lg:-mr-6 lg:w-120">
            <SitePhoto
              photo={photoFor(
                homePhotos.japaneseSchool,
                dict.home.japaneseSchool.photoAlt
              )}
              dark
              shape="circle"
              sizes="(max-width: 640px) 18rem, (max-width: 1024px) 24rem, 30rem"
              placeholderLabel={dict.home.japaneseSchool.photoLabel}
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
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 pb-4 sm:px-6 lg:grid-cols-4">
          {dict.home.japaneseSchool.highlights.map((item, i) => (
            <div key={i} className="reveal-rise flex flex-col items-start">
              <SitePhoto
                photo={photoFor(homePhotos.highlights[i], item.photoAlt)}
                dark
                sizes="(max-width: 1024px) 45vw, 17rem"
                placeholderLabel={dict.home.photoSoon}
                className="aspect-photo w-full rounded-xl"
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
                <GroupCard
                  key={group.id}
                  group={group}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
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

      <section id="about" className="section-wash-history relative scroll-mt-28 overflow-clip">
        <KanjiWatermark char="和" className="-bottom-10 left-4 text-ink/5" />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-4 sm:px-6 sm:pt-20 sm:pb-6">
          <HistoryTimeline
            milestones={milestones}
            photoLabel={dict.home.history.photoLabel}
          >
            <SectionKicker
              accent={dict.home.history.kickerAccent}
              caption={dict.home.history.kickerCaption}
              tone="magenta"
              order="caption-first"
              className="justify-center"
            />
            <h2 className="mt-5 font-display text-3xl leading-snug font-normal tracking-[0.02em]">
              <span className="text-ink">{dict.home.history.headingLine1}</span>
              <br />
              <span className="text-magenta">{dict.home.history.headingLine2}</span>
            </h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              {dict.home.history.body}
            </p>
            <p className="mt-6 border-l-2 border-magenta py-1 pl-5 text-left font-display leading-relaxed text-ink italic">
              <span className="block font-display text-xs font-semibold tracking-[0.14em] text-magenta uppercase not-italic">
                {dict.home.history.missionLabel}
              </span>
              <span className="mt-1.5 block">{dict.home.history.missionText}</span>
            </p>
          </HistoryTimeline>
        </div>

        <div className="reveal-rise relative mx-auto max-w-3xl px-4 pt-10 pb-20 text-center sm:px-6 sm:pb-24">
          <SectionKicker
            accent={dict.home.board.kickerAccent}
            caption={dict.home.board.kickerCaption}
            tone="magenta"
            order="caption-first"
            className="justify-center"
          />
          <h3 className="mt-4 font-display text-2xl leading-snug font-normal tracking-[0.02em] text-ink sm:text-3xl">
            {dict.home.board.title}
          </h3>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-ink-soft">
            {dict.home.board.intro}
          </p>
          <ul className="seigaiha-rings mt-8 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-line bg-mist px-6 py-6 text-left sm:grid-cols-3 sm:px-8 lg:-mx-12 lg:grid-cols-5">
            {dict.home.board.members.map((name) => (
              <li key={name} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-magenta" />
                <span className="font-display text-sm font-medium text-ink">{name}</span>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-7 max-w-xl leading-relaxed text-ink-soft">
            {dict.home.board.volunteersNote}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            {dict.home.board.note}{" "}
            <Link
              href={`${href("/")}#contact`}
              className="font-semibold text-indigo hover:text-indigo-deep"
            >
              {dict.home.board.noteLink}
            </Link>
          </p>
        </div>
      </section>

      {aboutVideoIds.length > 0 && (
        <section className="section-navy-scene seigaiha-rings seigaiha-rings-sky relative text-white">
          <KanjiWatermark char="映" className="-top-10 -right-8 text-white/5" />
          <WaveDivider
            id="videos-top"
            position="top"
            seed={19}
            className="relative text-paper"
          />
          <div className="relative mx-auto max-w-6xl px-4 pt-4 pb-22 sm:px-6 sm:pb-30 lg:pb-40">
            <div className="reveal-rise mx-auto max-w-2xl text-center">
              <SectionKicker
                accent={dict.home.history.videosKickerAccent}
                caption={dict.home.history.videosKickerCaption}
                tone="sky"
                order="caption-first"
                className="justify-center"
              />
              <h2 className="mt-4 font-display text-2xl leading-snug font-normal tracking-[0.02em] text-white sm:text-3xl">
                {dict.home.history.videosTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl leading-relaxed text-white/75">
                {dict.home.history.videoCaption}
              </p>
            </div>
            <div
              className={`mx-auto mt-10 grid gap-6 ${
                aboutVideoIds.length > 2
                  ? "sm:grid-cols-2 lg:grid-cols-3"
                  : aboutVideoIds.length > 1
                    ? "max-w-4xl sm:grid-cols-2"
                    : "max-w-3xl"
              }`}
            >
              {aboutVideoIds.map((id, i) => (
                <SiteVideo
                  key={id}
                  videoId={id}
                  dark
                  title={
                    aboutVideoIds.length > 1
                      ? `${dict.home.history.videoTitle} ${i + 1}`
                      : dict.home.history.videoTitle
                  }
                  className=""
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <div
        className={
          aboutVideoIds.length > 0
            ? "under-wave relative -mt-12 sm:-mt-20 lg:-mt-30"
            : "relative"
        }
      >
        <Image
          src={homePhotos.centennial}
          alt={dict.home.centennialPhotoAlt}
          width={2000}
          height={405}
          sizes="100vw"
          className="block h-auto min-h-64 w-full object-cover object-bottom sm:min-h-80 lg:min-h-0"
        />
        {aboutVideoIds.length > 0 && (
          <WaveDivider
            id="videos-bottom"
            accent="none"
            seed={33}
            className="absolute inset-x-0 top-0 text-transparent"
          />
        )}
      </div>

      <section
        id="contact"
        className="section-wash-connect relative scroll-mt-16 overflow-clip"
      >
        <KanjiWatermark char="絆" className="-top-4 -right-6 text-indigo/5" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="reveal-rise mx-auto max-w-2xl text-center">
            <SectionKicker
              accent={dict.home.connectKickerAccent}
              caption={dict.home.connectKickerCaption}
              tone="magenta"
              order="caption-first"
              className="justify-center"
            />
            <h2 className="mt-4 font-display text-2xl leading-snug font-normal tracking-[0.02em] text-ink sm:text-3xl">
              {dict.home.connectTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-soft">
              {dict.home.connectText}
            </p>
          </div>
          <div className="reveal-rise mt-10 grid gap-5 lg:grid-cols-[2fr_3fr]">
            <div className="surface-card flex flex-col divide-y divide-line overflow-clip">
              <a
                href={mapsUrl(CENTER_ADDRESS)}
                target="_blank"
                rel="noreferrer"
                aria-label={dict.home.contact.addressAria}
                className="flex flex-1 items-center gap-4 px-5 py-5 hover:bg-mist"
              >
                <ContactIcon name="pin" />
                <span>
                  <span className="block font-display text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
                    {dict.home.contact.addressLabel}
                  </span>
                  <span className="mt-1 block leading-relaxed text-ink">
                    {CENTER_ADDRESS}
                  </span>
                </span>
              </a>
              <a
                href={CENTER_PHONE_HREF}
                className="flex flex-1 items-center gap-4 px-5 py-5 hover:bg-mist"
              >
                <ContactIcon name="phone" />
                <span>
                  <span className="block font-display text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
                    {dict.home.contact.phoneLabel}
                  </span>
                  <span className="mt-1 block leading-relaxed text-ink">
                    {CENTER_PHONE}
                  </span>
                </span>
              </a>
              <a
                href={`mailto:${CENTER_EMAIL}`}
                className="flex flex-1 items-center gap-4 px-5 py-5 hover:bg-mist"
              >
                <ContactIcon name="mail" />
                <span>
                  <span className="block font-display text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
                    {dict.home.contact.emailLabel}
                  </span>
                  <span className="mt-1 block leading-relaxed break-all text-ink">
                    {CENTER_EMAIL}
                  </span>
                </span>
              </a>
            </div>
            <div className="surface-card relative min-h-64 overflow-clip lg:min-h-0">
              <iframe
                src={mapsEmbedUrl(CENTER_ADDRESS)}
                title={dict.home.contact.mapTitle}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
