import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HistoryFounders, type Founder } from "@/components/history-founders";
import { HistoryTimeline } from "@/components/history-timeline";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PhotoFrame } from "@/components/photo-frame";
import { SectionDivider } from "@/components/section-divider";
import { SectionKicker } from "@/components/section-kicker";
import { VolunteerSection } from "@/components/volunteer-section";
import { mapsEmbedUrl, mapsUrl } from "@/lib/center";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { historyMilestones } from "@/lib/history-milestones";
import { hasLocale, localePath } from "@/lib/i18n";
import { historyFounderPhotos } from "@/lib/photos";
import { getCenterContact } from "@/lib/site-settings";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";
import { getVolunteerSection } from "@/lib/volunteers";

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
      className="h-6 w-6 shrink-0 text-magenta transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-110"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {CONTACT_ICONS[name]}
    </svg>
  );
}

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.about.metaTitle,
    description: dict.about.metaDescription,
    alternates: {
      canonical: localePath(lang, "/about"),
      languages: {
        en: "/about",
        ja: "/ja/about",
        "x-default": "/about",
      },
    },
  };
}

export default async function AboutPage() {
  const lang = await getLocale();
  const [dict, volunteerSection, photos, contact] = await Promise.all([
    getDictionary(),
    getVolunteerSection(lang),
    getSitePhotos(),
    getCenterContact(),
  ]);
  const href = (path: string) => localePath(lang, path);
  const history = dict.home.history;

  const backdrop = slotPhoto(photos, "about.history-backdrop", "", lang);
  const milestones = historyMilestones(history).slice(0, -1);
  const founders: Founder[] = history.founders.flatMap((founder) => {
    const image = historyFounderPhotos[founder.id];
    return image ? [{ ...founder, photo: { image, alt: founder.photoAlt } }] : [];
  });

  return (
    <>
      <section className="section-wash-history relative isolate overflow-clip">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 mask-t-from-75% mask-b-from-70%"
        >
          <div className="parallax-drift absolute inset-x-0 -inset-y-16">
            <PhotoFrame framing={backdrop.framing}>
              <Image
                src={backdrop.src}
                alt=""
                fill
                sizes="100vw"
                className="photo-develop object-cover"
              />
            </PhotoFrame>
          </div>
          {/* At 88% the wash keeps every text color at AA over the darkest
              pixels of the photo; thin it and the kicker and captions fail. */}
          <div className="absolute inset-0 bg-paper/88" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-24 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-10">
          <div className="enter-rise lg:col-span-6">
            <SectionKicker
              accent={history.kickerAccent}
              caption={history.kickerCaption}
              tone="magenta"
              size="lg"
            />
            <h1 className="mt-5 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl 2xl:text-6xl">
              <span className="block text-ink">{history.headingLine1}</span>
              <span className="block text-magenta">{history.headingLine2}</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">{history.body}</p>
            <p className="mt-8 border-l-2 border-magenta py-1 pl-5 font-display text-lg leading-relaxed text-ink italic">
              <span className="block font-display text-sm font-semibold tracking-[0.14em] text-magenta uppercase not-italic">
                {history.missionLabel}
              </span>
              <span className="mt-1.5 block">{history.missionText}</span>
            </p>
          </div>

          <div className="mx-auto w-full max-w-3xl lg:col-span-6">
            <HistoryFounders label={history.foundersLabel} founders={founders} />
          </div>
        </div>
      </section>

      <SectionDivider ornament="crest" />
      <section
        id="history"
        className="section-wash-history relative scroll-mt-28 overflow-clip pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pb-24"
      >
        <KanjiWatermark char="和" className="-bottom-10 left-4 text-ink/5" />
        <div className="relative mx-auto max-w-wide px-4 sm:px-6 lg:px-10">
          <h2 className="sr-only">{history.timelineLabel}</h2>
          <HistoryTimeline
            milestones={milestones}
            photoLabel={history.photoLabel}
            className="mx-auto max-w-7xl"
          />
          <div className="reveal-rise text-center">
            <Link
              href={`${href("/")}#centennial`}
              className="button-primary inline-block rounded-lg px-7 py-4 font-display text-base font-semibold text-white"
            >
              {history.centennialCta}
            </Link>
          </div>
        </div>
      </section>

      {volunteerSection && (
        <>
          <SectionDivider ornament="seigaiha" align="start" />
          <section id="board" className="section-wash-history scroll-mt-28 pb-16 sm:pb-20 lg:pb-24">
            <VolunteerSection
              view={volunteerSection}
              labels={dict.home.board}
              contactHref="#contact"
            />
          </section>
        </>
      )}

      <SectionDivider ornament="blossom" align="end" />
      <section
        id="contact"
        className="section-wash-connect relative scroll-mt-28 overflow-clip"
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
                href={mapsUrl(contact.address)}
                target="_blank"
                rel="noreferrer"
                aria-label={dict.home.contact.addressAria}
                className="group flex flex-1 items-center gap-4 px-5 py-5 transition-colors hover:bg-mist"
              >
                <ContactIcon name="pin" />
                <span>
                  <span className="block font-display text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
                    {dict.home.contact.addressLabel}
                  </span>
                  <span data-edit-record="contact:address" className="mt-1 block leading-relaxed text-ink">
                    {contact.address}
                  </span>
                </span>
              </a>
              <a
                href={contact.phoneHref}
                className="group flex flex-1 items-center gap-4 px-5 py-5 transition-colors hover:bg-mist"
              >
                <ContactIcon name="phone" />
                <span>
                  <span className="block font-display text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
                    {dict.home.contact.phoneLabel}
                  </span>
                  <span data-edit-record="contact:phone" className="mt-1 block leading-relaxed text-ink">
                    {contact.phone}
                  </span>
                </span>
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="group flex flex-1 items-center gap-4 px-5 py-5 transition-colors hover:bg-mist"
              >
                <ContactIcon name="mail" />
                <span>
                  <span className="block font-display text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
                    {dict.home.contact.emailLabel}
                  </span>
                  <span data-edit-record="contact:email" className="mt-1 block leading-relaxed break-all text-ink">
                    {contact.email}
                  </span>
                </span>
              </a>
            </div>
            <div className="surface-card relative min-h-64 overflow-clip lg:min-h-0">
              <iframe
                src={mapsEmbedUrl(contact.address)}
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
