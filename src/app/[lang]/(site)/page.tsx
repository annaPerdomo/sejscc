import Link from "next/link";
import { EventsHero } from "@/components/events-hero";
import { BambooGrove } from "@/components/bamboo-grove";
import {
  GroupsShowcase,
  type GroupsShowcaseItem,
} from "@/components/groups-showcase";
import { CentennialEmaki } from "@/components/centennial-emaki";
import { CentennialFinale } from "@/components/history-timeline";
import { SectionHeading } from "@/components/section-heading";
import { SchoolSeal } from "@/components/school-seal";
import { SchoolSlideshow, type SchoolSlide } from "@/components/school-slideshow";
import { SectionKicker } from "@/components/section-kicker";
import { SiteVideo } from "@/components/site-video";
import { SectionDivider } from "@/components/section-divider";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { weekDays } from "@/db/schema";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";
import { getAboutVideoUrls } from "@/lib/site-settings";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";
import { historyMilestones } from "@/lib/history-milestones";
import { youtubeVideoId } from "@/lib/video";
import { historyCentennialPhotos, homePhotos } from "@/lib/photos";
import { ZoomablePhoto } from "@/components/zoomable-photo";

export const revalidate = 300;

const CENTENNIAL_ANCHOR = "centennial";
const CENTENNIAL_PHOTO_ANCHOR = "centennial-photo";

export default async function HomePage() {
  const lang = await getLocale();
  const [dict, upcoming, groups, aboutVideoUrls, photos] = await Promise.all([
    getDictionary(),
    getUpcomingEvents(5),
    getActiveGroups(),
    getAboutVideoUrls(),
    getSitePhotos(),
  ]);
  const href = (path: string) => localePath(lang, path);
  const aboutVideoIds = aboutVideoUrls
    .map((url) => youtubeVideoId(url))
    .filter((id): id is string => id !== null);

  const showcase: GroupsShowcaseItem[] = groups
    .filter((group) => group.status === "meeting")
    .map((group) => ({
      id: group.id,
      name: group.name,
      websiteUrl: group.websiteUrl,
      description: group.description,
      schedule:
        group.meetingSchedule ??
        (group.meetingDays.length > 0
          ? weekDays
              .filter((day) => group.meetingDays.includes(day))
              .map((day) => dict.groups.weekDays[day])
              .join(" · ")
          : null),
      imageUrl: group.imageUrl,
      logoUrl: group.imageIsLogo ? group.imageUrl : null,
      photoUrls: group.photoUrls,
    }));

  const schoolSlides: SchoolSlide[] = dict.home.japaneseSchool.slides.flatMap(
    (slideText, i) => {
      if (!homePhotos.schoolSlides[i]) return [];
      const photo = slotPhoto(photos, `home.school-slide.${i}`, slideText.alt, lang);
      return [{ ...slideText, src: photo.src, alt: photo.alt, framing: photo.framing }];
    },
  );

  const centennialFinale = historyMilestones(dict.home.history).at(-1);

  const centennialGallery = dict.home.history.centennialGallery.flatMap((item) => {
    const image = historyCentennialPhotos[item.id];
    return image ? [{ image, alt: item.photoAlt }] : [];
  });

  const centennialPhoto = slotPhoto(
    photos,
    "home.centennial",
    dict.home.centennialPhotoAlt,
    lang
  );

  return (
    <>
      <EventsHero events={upcoming} />
      <SectionDivider ornament="crest" />

      <section
        id="groups"
        className="section-wash-groups relative z-10 scroll-mt-28"
      >
        <BambooGrove />
        <div className="relative mx-auto max-w-wide px-5 pt-12 pb-20 sm:px-10 sm:pt-14 sm:pb-24 lg:px-16 lg:pb-32">
          {showcase.length > 0 ? (
            <GroupsShowcase
              items={showcase}
              ctaHref={href("/groups")}
              labels={{
                kickerAccent: dict.home.sportsClubs.kickerAccent,
                kickerCaption: dict.home.sportsClubs.kickerCaption,
                headingLine1: dict.home.sportsClubs.headingLine1,
                headingLine2: dict.home.sportsClubs.headingLine2,
                body: dict.home.sportsClubs.body,
                cta: dict.home.sportsClubs.cta,
                list: dict.home.sportsClubs.listLabel,
                website: dict.groups.website,
                pause: dict.home.sportsClubs.pause,
                play: dict.home.sportsClubs.play,
                photo: dict.home.sportsClubs.photo,
                photoAlt: dict.home.sportsClubs.photoAlt,
              }}
            />
          ) : (
            <div>
              <SectionKicker
                accent={dict.home.sportsClubs.kickerAccent}
                caption={dict.home.sportsClubs.kickerCaption}
                size="lg"
              />
              <SectionHeading className="mt-3">
                <span className="text-indigo">
                  {dict.home.sportsClubs.headingLine1}
                </span>{" "}
                {dict.home.sportsClubs.headingLine2}
              </SectionHeading>
              <p className="mt-5 max-w-2xl text-lg text-ink-soft">
                {dict.home.sportsClubs.empty}
              </p>
            </div>
          )}
        </div>
      </section>

      <SectionDivider ornament="seigaiha" align="start" />
      <section
        id="school"
        className="section-midnight-scene seigaiha-rings seigaiha-rings-sky scroll-mt-28 text-white"
      >
        <KanjiWatermark char="学" className="-top-14 -left-10 text-white/5" />
        <div className="relative mx-auto max-w-wide px-4 pt-16 pb-20 sm:pt-20 sm:px-6 sm:pb-24 lg:px-10 lg:pb-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
            <div className="reveal-rise lg:col-span-5">
              <div className="grid items-start gap-x-5 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <SectionKicker
                    accent={dict.home.japaneseSchool.kickerAccent}
                    caption={dict.home.japaneseSchool.kickerCaption}
                    tone="sky"
                    size="lg"
                  />
                  <h2 className="mt-5 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl">
                    <span className="block text-white">
                      {dict.home.japaneseSchool.headingLine1}
                    </span>
                    <span className="block text-sky">
                      {dict.home.japaneseSchool.headingLine2}
                    </span>
                  </h2>
                  <p className="mt-5 font-display text-xl font-semibold text-sky">
                    {dict.home.japaneseSchool.subheading}
                  </p>
                </div>
                <div className="relative mt-7 mr-14 w-fit sm:row-span-2 sm:mt-0 sm:mr-0">
                  <p
                    lang="ja"
                    className="school-plaque font-accent text-base font-bold tracking-[0.16em] whitespace-nowrap max-sm:writing-horizontal sm:text-xl"
                  >
                    {dict.home.japaneseSchool.plaque}
                  </p>
                  <SchoolSeal
                    accent={dict.home.japaneseSchool.sealAccent}
                    year={dict.home.japaneseSchool.sealYear}
                    size="sm"
                    className="reveal-pop z-10 max-sm:top-1/2 max-sm:left-full max-sm:mt-0 max-sm:-translate-x-3 max-sm:-translate-y-1/2"
                  />
                </div>
                <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/80 sm:mt-5">
                  {dict.home.japaneseSchool.body}
                </p>
              </div>
              <ul
                aria-label={dict.home.japaneseSchool.skillsLabel}
                className="mt-7 grid max-w-sm grid-cols-4 gap-3 sm:gap-4"
              >
                {dict.home.japaneseSchool.skills.map((skill) => (
                  <li key={skill.kanji} className="flex flex-col items-center gap-2">
                    <span
                      lang="ja"
                      aria-hidden="true"
                      className="kanji-box w-full font-accent text-4xl font-bold text-white sm:text-5xl"
                    >
                      {skill.kanji}
                    </span>
                    <span className="font-display text-base font-semibold text-sky">
                      {skill.label}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`${href("/school")}#tuition`}
                  className="button-primary rounded-lg px-7 py-4 font-display text-base font-semibold text-white"
                >
                  {dict.home.japaneseSchool.primaryCta}
                </Link>
                <Link
                  href={href("/groups")}
                  className="rounded-lg border-2 border-white/50 px-7 py-3.5 font-display text-base font-semibold text-white hover:border-white hover:bg-white/10"
                >
                  {dict.home.japaneseSchool.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <SchoolSlideshow
                slides={schoolSlides}
                sizes="(max-width: 1024px) 100vw, 52rem"
                labels={{
                  region: dict.home.japaneseSchool.slidesLabel,
                  pause: dict.home.japaneseSchool.slidePause,
                  play: dict.home.japaneseSchool.slidePlay,
                  show: dict.home.japaneseSchool.slideShow,
                }}
                className="reveal-bloom"
              />
            </div>
          </div>
        </div>
      </section>

      {aboutVideoIds.length > 0 && (
        <>
          <SectionDivider ornament="asanoha" />
          <section id="videos" className="section-plum-scene scroll-mt-28 text-white">
            <KanjiWatermark char="映" className="-top-10 -right-8 text-white/5" />
            <div className="relative mx-auto max-w-wide px-4 pt-16 pb-16 sm:px-6 sm:pt-20 sm:pb-20 lg:px-10 lg:pb-24">
              <div className="reveal-rise mx-auto max-w-2xl text-center">
                <SectionKicker
                  accent={dict.home.history.videosKickerAccent}
                  caption={dict.home.history.videosKickerCaption}
                  tone="plum"
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
                className={`mx-auto mt-10 grid max-w-3xl gap-6 lg:gap-8 ${
                  aboutVideoIds.length > 2
                    ? "reveal-stagger-3 lg:max-w-none lg:grid-cols-3"
                    : aboutVideoIds.length > 1
                      ? "reveal-stagger-2 sm:grid-cols-2 lg:max-w-6xl"
                      : "lg:max-w-4xl"
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
        </>
      )}
      <SectionDivider ornament="blossom" align="end" />

      <section
        id="anniversary"
        className="section-midnight-scene seigaiha-rings seigaiha-rings-gold relative scroll-mt-28"
      >
        {centennialFinale && (
          <CentennialFinale
            milestone={centennialFinale}
            photoCaption={dict.home.history.centennialPhotoCaption}
            id={CENTENNIAL_ANCHOR}
          />
        )}

        {centennialGallery.length > 0 && (
          <CentennialEmaki
            photos={centennialGallery}
            interludes={dict.home.history.centennialInterludes}
            copy={{
              ...dict.home.history.centennialStage,
              label: dict.home.history.centennialGalleryLabel,
            }}
            skipTo={`#${CENTENNIAL_PHOTO_ANCHOR}`}
            skipBackTo={`#${CENTENNIAL_ANCHOR}`}
          />
        )}

        <div id={CENTENNIAL_PHOTO_ANCHOR} className="scroll-mt-28">
          <ZoomablePhoto
            photo={{
              src: centennialPhoto.src,
              alt: centennialPhoto.alt,
              width: centennialPhoto.width ?? homePhotos.centennial.width,
              height: centennialPhoto.height ?? homePhotos.centennial.height,
            }}
            labels={dict.home.centennialZoom}
          />
        </div>
      </section>
    </>
  );
}
