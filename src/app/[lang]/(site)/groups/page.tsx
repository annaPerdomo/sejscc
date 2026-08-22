import type { Metadata } from "next";
import { BrushEdge } from "@/components/brush-edge";
import { ExternalLink } from "@/components/external-link";
import { GroupMedia } from "@/components/group-media";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { SectionKicker } from "@/components/section-kicker";
import { WaveDivider } from "@/components/wave-divider";
import { weekDays } from "@/db/schema";
import { getActiveGroups } from "@/lib/events";
import { getDictionary, getDictionaryFor } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";

export const revalidate = 300;

const CENTER_EMAIL = "info@sejscc.org";
const CENTER_PHONE = "(562) 863-5996";
const CENTER_PHONE_HREF = "tel:+15628635996";

const HERO_TILES = [
  "lg:col-start-1 lg:col-span-7 lg:row-start-1 lg:row-span-7",
  "lg:col-start-8 lg:col-span-5 lg:row-start-1 lg:row-span-5",
  "lg:col-start-8 lg:col-span-5 lg:row-start-6 lg:row-span-7",
  "lg:col-start-1 lg:col-span-7 lg:row-start-8 lg:row-span-5",
];
const CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22rem";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.groups.metaTitle,
    description: dict.groups.metaDescription,
    alternates: {
      canonical: localePath(lang, "/groups"),
      languages: {
        en: "/groups",
        ja: "/ja/groups",
        "x-default": "/groups",
      },
    },
  };
}

function TitleBrushRule() {
  return (
    <svg
      viewBox="0 0 320 14"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="mt-5 block h-3.5 w-56 overflow-visible sm:w-80"
    >
      <defs>
        <filter id="groups-title-brush" x="-4%" y="-300%" width="108%" height="700%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.3"
            numOctaves="3"
            seed="9"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
        </filter>
      </defs>
      <path
        d="M2,8 C70,4 180,10 318,6"
        fill="none"
        className="stroke-gold"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
        filter="url(#groups-title-brush)"
      />
      <path
        d="M6,11 C90,7 200,12 300,8"
        fill="none"
        className="stroke-gold/40"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="34 22 60 30"
        filter="url(#groups-title-brush)"
      />
    </svg>
  );
}

export default async function GroupsPage() {
  const [dict, groups] = await Promise.all([getDictionary(), getActiveGroups()]);

  const week = weekDays.map((day) => ({
    day,
    entries: groups.filter(
      (group) => group.status === "meeting" && group.meetingDays.includes(day)
    ),
  }));
  const hasWeek = week.some(({ entries }) => entries.length > 0);

  return (
    <>
      <section className="section-wash-groups-hero relative overflow-clip">
        <KanjiWatermark char="輪" className="-bottom-24 -left-12 text-indigo/5" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 sm:px-6 sm:pt-14 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14 lg:pb-24">
          <div className="reveal-rise">
            <SectionKicker
              accent={dict.groups.kickerAccent}
              caption={dict.groups.kickerCaption}
            />
            <h1 className="mt-4 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl">
              <span className="block text-ink">{dict.groups.titleLine1}</span>
              <span className="block text-indigo">{dict.groups.titleLine2}</span>
            </h1>
            <TitleBrushRule />
            <p className="mt-6 max-w-xl leading-relaxed text-ink-soft">
              {dict.groups.lede}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              {hasWeek && (
                <a
                  href="#week"
                  className="button-primary rounded-lg px-6 py-3.5 font-display text-sm font-semibold text-white"
                >
                  {dict.groups.scheduleCta}
                </a>
              )}
              <a
                href="#start"
                className="font-display text-sm font-semibold text-magenta hover:text-magenta-deep"
              >
                {dict.groups.startCta}
              </a>
            </div>
          </div>

          <div className="reveal-rise grid w-full shrink-0 grid-cols-2 shadow-sm lg:h-104 lg:w-112 lg:grid-cols-12 lg:grid-rows-12 xl:h-124 xl:w-132">
            {HERO_TILES.map((placement, i) => (
              <PhotoPlaceholder
                key={i}
                label={dict.groups.photoLabel}
                frame={false}
                className={`aspect-photo w-full border border-line lg:aspect-auto ${placement}`}
              />
            ))}
          </div>
        </div>
        <BrushEdge id="groups-hero" variant="paper" className="absolute inset-x-0 bottom-0" />
      </section>

      <section className="relative overflow-clip bg-white pt-12 pb-16 sm:pt-14 sm:pb-20">
        <KanjiWatermark char="道" className="top-64 -right-16 text-indigo/5" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal-rise mb-9">
            <SectionKicker
              accent={dict.groups.directoryAccent}
              caption={dict.groups.directoryCaption}
            />
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[0.02em] text-ink sm:text-4xl">
              {dict.groups.directoryTitle}
            </h2>
          </div>

          {groups.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const muted = group.status !== "meeting";
                const statusLabel =
                  group.status === "paused"
                    ? dict.groups.pausedLabel
                    : group.status === "cancelled"
                      ? dict.groups.cancelledLabel
                      : null;

                return (
                  <article
                    key={group.id}
                    className={`reveal-rise relative flex flex-col overflow-clip ${
                      muted
                        ? "rounded-xl border border-dashed border-line bg-cloud"
                        : "surface-card surface-card-link"
                    }`}
                  >
                    <GroupMedia
                      src={group.imageUrl}
                      placeholderLabel={dict.groups.photoLabel}
                      sizes={CARD_SIZES}
                      muted={muted}
                      className="border-b border-line"
                    />
                    {statusLabel && (
                      <span className="absolute top-3 right-3 rounded-md border border-line bg-white/90 px-2.5 py-1 font-display text-[11px] font-semibold tracking-[0.14em] text-stone uppercase">
                        {statusLabel}
                      </span>
                    )}

                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <h3
                          className={`font-display text-lg font-semibold ${
                            muted ? "text-ink-soft" : "text-ink"
                          }`}
                        >
                          {group.name}
                        </h3>
                        {group.nameJa && (
                          <span
                            lang="ja"
                            className={`font-accent text-sm font-bold tracking-[0.16em] ${
                              muted ? "text-stone" : "text-indigo"
                            }`}
                          >
                            {group.nameJa}
                          </span>
                        )}
                      </div>

                      {group.meetingSchedule && (
                        <p
                          className={`font-display text-xs font-semibold tracking-[0.1em] uppercase ${
                            muted ? "text-stone" : "text-magenta"
                          }`}
                        >
                          {group.meetingSchedule}
                        </p>
                      )}

                      {group.description && (
                        <p
                          className={`text-sm leading-relaxed ${
                            muted ? "text-stone" : "text-ink-soft"
                          }`}
                        >
                          {group.description}
                        </p>
                      )}

                      {(group.websiteUrl || group.contactEmail) && (
                        <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-dashed border-indigo/25 pt-4 font-display text-sm font-semibold">
                          {group.websiteUrl && (
                            <ExternalLink
                              href={group.websiteUrl}
                              className="text-indigo hover:text-indigo-deep"
                            >
                              {dict.groups.website}
                            </ExternalLink>
                          )}
                          {group.contactEmail && (
                            <a
                              href={`mailto:${group.contactEmail}`}
                              className="break-all text-indigo hover:text-indigo-deep"
                            >
                              {group.contactEmail}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-line bg-mist p-8 text-ink-soft">
              {dict.groups.empty}
            </p>
          )}
        </div>
      </section>

      {hasWeek && (
        <section
          id="week"
          className="section-navy-scene relative scroll-mt-28 overflow-clip text-white"
        >
          <KanjiWatermark char="週" className="-right-12 -bottom-20 text-white/5" />
          <WaveDivider id="week-top" position="top" seed={19} className="relative text-white" />
          <div className="relative mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 sm:pb-8">
            <div className="reveal-rise mb-9">
              <SectionKicker
                accent={dict.groups.weekAccent}
                caption={dict.groups.weekCaption}
                tone="sky"
              />
              <h2 className="mt-3 font-display text-3xl font-normal tracking-[0.02em] sm:text-4xl">
                <span className="block text-white">{dict.groups.weekTitleLine1}</span>
                <span className="block text-sky">{dict.groups.weekTitleLine2}</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
                {dict.groups.weekNote}
              </p>
            </div>

            <div className="reveal-rise grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4 lg:grid-cols-7">
              {week.map(({ day, entries }) => (
                <div
                  key={day}
                  className="lg:border-l lg:border-white/15 lg:pl-5 lg:first:border-l-0 lg:first:pl-0"
                >
                  <h3
                    className={`border-b-2 pb-2 font-display text-sm font-semibold tracking-[0.14em] uppercase ${
                      entries.length
                        ? "border-indigo text-white"
                        : "border-white/20 text-white/70"
                    }`}
                  >
                    {dict.groups.weekDays[day]}
                  </h3>
                  {entries.length > 0 ? (
                    <ul className="mt-3.5 space-y-2.5">
                      {entries.map((group) => (
                        <li key={group.id} className="text-sm text-white/85">
                          {group.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3.5 text-sm leading-relaxed text-white/75">
                      {dict.groups.weekQuiet}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <WaveDivider id="week-bottom" seed={31} className="text-mist" />
        </section>
      )}

      <section id="start" className="relative scroll-mt-28 overflow-clip bg-mist">
        <KanjiWatermark char="始" className="-top-20 right-4 text-indigo/5" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-9 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:gap-14">
          <div className="reveal-rise max-w-2xl">
            <SectionKicker
              accent={dict.groups.startAccent}
              caption={dict.groups.startCaption}
            />
            <h2 className="mt-4 font-display text-2xl font-normal tracking-[0.02em] sm:text-3xl">
              <span className="block text-indigo">{dict.groups.useTitleLine1}</span>
              <span className="block text-ink">{dict.groups.useTitleLine2}</span>
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              {dict.groups.useBefore}
              <a
                href={`mailto:${CENTER_EMAIL}`}
                className="font-semibold text-indigo hover:text-indigo-deep"
              >
                {CENTER_EMAIL}
              </a>
              {dict.groups.useBetween}
              <a
                href={CENTER_PHONE_HREF}
                className="font-semibold text-indigo hover:text-indigo-deep"
              >
                {CENTER_PHONE}
              </a>
              {dict.groups.useAfter}
            </p>
          </div>
          <div className="reveal-rise flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={`mailto:${CENTER_EMAIL}`}
              className="button-donate rounded-lg px-7 py-3.5 text-center font-display text-sm font-semibold text-white"
            >
              {dict.groups.useEmailCta}
            </a>
            <a
              href={CENTER_PHONE_HREF}
              className="rounded-lg border-2 border-ink/20 px-7 py-3 text-center font-display text-sm font-semibold text-ink hover:border-ink"
            >
              {dict.groups.useCallCta}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
