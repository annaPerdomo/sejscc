import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DocumentLink } from "@/components/document-link";
import { GroupPortrait } from "@/components/group-portrait";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PhotoHero } from "@/components/photo-hero";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { WaveDivider } from "@/components/wave-divider";
import { weekDays } from "@/db/schema";
import {
  CENTER_EMAIL,
  CENTER_PHONE,
  CENTER_PHONE_HREF,
} from "@/lib/center";
import { getActiveGroups } from "@/lib/events";
import {
  FACILITY_USE_FORM_URL,
  FACILITY_USE_TERMS_URL,
  NEW_CLUB_FORM_URL,
  NEW_CLUB_PROCEDURE_URL,
} from "@/lib/groups";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";
import { groupsPhotos } from "@/lib/photos";

export const revalidate = 300;

const DAY_KANJI = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
} as const;

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
  const [lang, dict, groups] = await Promise.all([
    getLocale(),
    getDictionary(),
    getActiveGroups(),
  ]);

  const week = weekDays.map((day) => ({
    day,
    entries: groups.filter(
      (group) => group.status === "meeting" && group.meetingDays.includes(day)
    ),
  }));
  const hasWeek = week.some(({ entries }) => entries.length > 0);

  return (
    <>
      <PhotoHero
        id="groups"
        photo={groupsPhotos.hero}
        photoAlt={dict.groups.heroPhotoAlt}
        accent={dict.groups.kickerAccent}
        caption={dict.groups.kickerCaption}
        titleLine1={dict.groups.titleLine1}
        titleLine2={dict.groups.titleLine2}
        lede={<p>{dict.groups.lede}</p>}
        settlesInto="paper"
        actions={
          <>
            {hasWeek && (
              <a href="#week" className="button-light px-7 py-4 text-base">
                {dict.groups.scheduleCta}
              </a>
            )}
            <a
              href="#club"
              className="link-arrow py-2 font-display text-lg font-semibold text-sky hover:text-white"
            >
              {dict.groups.startCta}
            </a>
          </>
        }
      />

      <section className="seigaiha-rings seigaiha-rings-fade relative bg-paper pt-10 pb-20 sm:pt-14 sm:pb-28 lg:pb-40">
        <KanjiWatermark char="道" className="top-40 -right-14 text-indigo/5" />
        <div className="relative mx-auto max-w-wide px-5 sm:px-10 lg:px-16">
          <div className="reveal-rise mb-12 max-w-3xl">
            <SectionKicker
              accent={dict.groups.directoryAccent}
              caption={dict.groups.directoryCaption}
              size="lg"
            />
            <SectionHeading className="mt-4 sm:text-5xl">
              {dict.groups.directoryTitle}
            </SectionHeading>
          </div>
          {groups.length > 0 ? (
            <div className="drift-columns reveal-stagger-2-3 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 2xl:grid-cols-4">
              {groups.map((group) => (
                <div key={group.id}>
                  <GroupPortrait group={group} />
                </div>
              ))}
            </div>
          ) : (
            <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">
              {dict.groups.empty}
            </p>
          )}
        </div>
      </section>

      {hasWeek && (
        <section
          id="week"
          className="section-navy-scene seigaiha-rings seigaiha-rings-sky relative scroll-mt-28 border-b-8 border-gold text-white"
        >
          <KanjiWatermark char="週" className="-right-12 -bottom-20 text-white/5" />
          <WaveDivider id="week-top" position="top" seed={19} className="relative text-paper" />
          <div className="relative mx-auto max-w-wide px-5 pt-6 pb-20 sm:px-10 sm:pb-24 lg:px-16">
            <div className="reveal-rise mb-12 max-w-3xl">
              <SectionKicker
                accent={dict.groups.weekAccent}
                caption={dict.groups.weekCaption}
                tone="sky"
                size="lg"
              />
              <h2 className="mt-4 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl">
                <span className="text-white">{dict.groups.weekTitleLine1}</span>{" "}
                <span className="text-sky">{dict.groups.weekTitleLine2}</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/85">
                {dict.groups.weekNote}
              </p>
            </div>

            <div className="reveal-stagger-4-7 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 lg:grid-cols-7 lg:gap-x-5">
              {week.map(({ day, entries }) => (
                <div key={day} className="reveal-rise flex flex-col">
                  <h3 className="flex flex-col items-center gap-2">
                    <span
                      lang="ja"
                      aria-hidden="true"
                      className={`kanji-box w-20 font-accent text-5xl font-bold ${
                        entries.length ? "text-white" : "text-white/60"
                      }`}
                    >
                      {DAY_KANJI[day]}
                    </span>
                    <span
                      className={
                        dict.groups.weekDays[day] === DAY_KANJI[day]
                          ? "sr-only"
                          : "font-display text-base font-semibold tracking-[0.16em] text-sky uppercase"
                      }
                    >
                      {dict.groups.weekDays[day]}
                    </span>
                  </h3>
                  {entries.length > 0 ? (
                    <ul className="mt-5 flex flex-col gap-3">
                      {entries.map((group) => (
                        <li
                          key={group.id}
                          className="nafuda text-center font-display text-base leading-snug font-semibold"
                        >
                          {group.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-5 rounded-xs border-2 border-dashed border-white/30 px-3 py-4 text-center text-base leading-snug text-white/80">
                      {dict.groups.weekQuiet}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="reveal-rise mt-14 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
              <Link
                href={localePath(lang, "/events#calendars")}
                className="button-light shrink-0 px-7 py-4 text-center text-base"
              >
                {dict.groups.weekCalendarCta}
              </Link>
              <p className="max-w-xl text-lg leading-relaxed text-white/85">
                {dict.groups.weekCalendarNote}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2">
        {[
          {
            id: "room",
            surface: "bg-azure",
            watermark: "室",
            copy: dict.groups.room,
            note: dict.groups.room.eligibility,
            documents: [
              {
                href: FACILITY_USE_FORM_URL,
                format: dict.groups.formatPdf,
                label: dict.groups.room.formLabel,
                description: dict.groups.room.formDescription,
              },
              {
                href: FACILITY_USE_TERMS_URL,
                format: dict.groups.formatPdf,
                label: dict.groups.room.termsLabel,
                description: dict.groups.room.termsDescription,
              },
            ],
          },
          {
            id: "club",
            surface: "bg-cream",
            watermark: "部",
            copy: dict.groups.club,
            note: dict.groups.club.mission,
            documents: [
              {
                href: NEW_CLUB_PROCEDURE_URL,
                format: dict.groups.formatDoc,
                label: dict.groups.club.procedureLabel,
                description: dict.groups.club.procedureDescription,
              },
              {
                href: NEW_CLUB_FORM_URL,
                format: dict.groups.formatPdf,
                label: dict.groups.club.formLabel,
                description: dict.groups.club.formDescription,
              },
            ],
          },
        ].map((panel) => (
          <section
            key={panel.id}
            id={panel.id}
            className={`relative scroll-mt-28 overflow-clip px-5 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 ${panel.surface}`}
          >
            <KanjiWatermark char={panel.watermark} className="-top-10 -right-8 text-indigo/5" />
            <div className="relative max-w-2xl">
              <div className="reveal-rise">
                <SectionKicker
                  accent={panel.copy.accent}
                  caption={panel.copy.caption}
                  tone="tinted"
                  size="lg"
                />
                <SectionHeading className="mt-4 sm:text-5xl">{panel.copy.title}</SectionHeading>
                <p className="mt-5 text-lg leading-relaxed text-ink">{panel.copy.lede}</p>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">{panel.note}</p>
              </div>
              <div className="reveal-stagger-2 mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {panel.documents.map((document) => (
                  <DocumentLink key={document.label} {...document} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section id="start" className="relative isolate scroll-mt-28 overflow-clip bg-ink-deep text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src={groupsPhotos.start}
            alt={dict.groups.usePhotoAlt}
            fill
            sizes="100vw"
            className="ken-burns-out object-cover"
          />
          {/* The wash keeps white copy at AA over the bright dojo walls. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-ink-deep/90 via-ink-deep/80 to-ink-deep/95 lg:bg-gradient-to-r lg:from-ink-deep/95 lg:via-ink-deep/85 lg:to-ink-deep/40"
          />
        </div>
        <div className="relative mx-auto flex max-w-wide flex-col gap-10 px-5 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36">
          <div className="reveal-rise max-w-2xl">
            <SectionKicker
              accent={dict.groups.startAccent}
              caption={dict.groups.startCaption}
              tone="photo"
              size="lg"
            />
            <h2 className="mt-5 font-display text-5xl leading-tight font-light sm:text-6xl">
              <span className="block text-white">{dict.groups.useTitleLine1}</span>
              <span className="block font-normal text-sky">{dict.groups.useTitleLine2}</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/90 sm:text-xl">
              {dict.groups.useBefore}
              <a
                href={`mailto:${CENTER_EMAIL}`}
                className="font-semibold text-white underline decoration-sky underline-offset-4 hover:text-sky"
              >
                {CENTER_EMAIL}
              </a>
              {dict.groups.useBetween}
              <a
                href={CENTER_PHONE_HREF}
                className="font-semibold text-white underline decoration-sky underline-offset-4 hover:text-sky"
              >
                {CENTER_PHONE}
              </a>
              {dict.groups.useAfter}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-white/85">{dict.groups.useFit}</p>
          </div>
          <div className="reveal-rise flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${CENTER_EMAIL}`}
              className="button-donate rounded-lg px-8 py-4 text-center font-display text-base font-semibold text-white"
            >
              {dict.groups.useEmailCta}
            </a>
            <a
              href={CENTER_PHONE_HREF}
              className="button-outline-light px-8 py-3.5 text-center text-base"
            >
              {dict.groups.useCallCta}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
