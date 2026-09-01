import type { Metadata } from "next";
import { ExternalLink } from "@/components/external-link";
import { GroupMedia } from "@/components/group-media";
import { GroupSpotlight } from "@/components/group-spotlight";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PageHero } from "@/components/page-hero";
import { PageSection } from "@/components/page-section";
import { SectionKicker } from "@/components/section-kicker";
import { SitePhoto } from "@/components/site-photo";
import { WaveDivider } from "@/components/wave-divider";
import { weekDays } from "@/db/schema";
import { getActiveGroups } from "@/lib/events";
import { getDictionary, getDictionaryFor } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { groupsHeroPhoto, photoFor } from "@/lib/photos";

export const revalidate = 300;

const CENTER_EMAIL = "info@sejscc.org";
const CENTER_PHONE = "(562) 863-5996";
const CENTER_PHONE_HREF = "tel:+15628635996";

const CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 17rem";

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

export default async function GroupsPage() {
  const [dict, groups] = await Promise.all([getDictionary(), getActiveGroups()]);

  const week = weekDays.map((day) => ({
    day,
    entries: groups.filter(
      (group) => group.status === "meeting" && group.meetingDays.includes(day)
    ),
  }));
  const hasWeek = week.some(({ entries }) => entries.length > 0);

  const spotlight = groups.filter((group) => group.status === "meeting");

  return (
    <>
      <PageHero
        id="groups"
        wash="section-wash-groups-hero"
        watermark="輪"
        watermarkClassName="-bottom-24 -left-12 text-indigo/5"
        accent={dict.groups.kickerAccent}
        caption={dict.groups.kickerCaption}
        titleLine1={dict.groups.titleLine1}
        titleLine2={dict.groups.titleLine2}
        lede={dict.groups.lede}
        actions={
          <>
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
          </>
        }
        media={
          <SitePhoto
            photo={photoFor(groupsHeroPhoto, dict.groups.heroPhotoAlt)}
            preload
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 26rem"
            placeholderLabel={dict.groups.photoLabel}
            className="reveal-rise aspect-photo w-full rounded-xl border border-line shadow-sm lg:w-96 xl:w-104"
          />
        }
        below={
          spotlight.length > 0 && (
            <GroupSpotlight
              groups={spotlight}
              label={dict.groups.spotlightLabel}
              websiteLabel={dict.groups.website}
              prevLabel={dict.groups.spotlightPrev}
              nextLabel={dict.groups.spotlightNext}
              pauseLabel={dict.groups.spotlightPause}
              playLabel={dict.groups.spotlightPlay}
              photoLabel={dict.groups.photoLabel}
              slideLabel={dict.groups.spotlightSlide}
            />
          )
        }
      />

      <PageSection
        surface="white"
        watermark="道"
        watermarkClassName="top-64 -right-16 text-indigo/5"
        accent={dict.groups.directoryAccent}
        caption={dict.groups.directoryCaption}
        title={dict.groups.directoryTitle}
      >
        {groups.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                            className="break-words text-indigo hover:text-indigo-deep"
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
      </PageSection>

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
            <p className="mt-4 leading-relaxed text-ink-soft">
              {dict.groups.useFit}
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
