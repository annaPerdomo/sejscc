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
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { historyMilestones } from "@/lib/history-milestones";
import { hasLocale, localePath } from "@/lib/i18n";
import { historyFounderPhotos } from "@/lib/photos";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";
import { getVolunteerSection } from "@/lib/volunteers";

export const revalidate = 300;

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
  const [dict, volunteerSection, photos] = await Promise.all([
    getDictionary(),
    getVolunteerSection(lang),
    getSitePhotos(),
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
    </>
  );
}
