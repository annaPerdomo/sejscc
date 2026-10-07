import Image from "next/image";
import Link from "next/link";
import { BrushEdge } from "@/components/brush-edge";
import { EventsHero } from "@/components/events-hero";
import { BambooGrove } from "@/components/bamboo-grove";
import {
  GroupsShowcase,
  type GroupsShowcaseItem,
} from "@/components/groups-showcase";
import { CentennialEmaki } from "@/components/centennial-emaki";
import { HistoryFounders, type Founder } from "@/components/history-founders";
import { HistoryTimeline, type Milestone } from "@/components/history-timeline";
import { SectionHeading } from "@/components/section-heading";
import { SchoolSlideshow, type SchoolSlide } from "@/components/school-slideshow";
import { SectionKicker } from "@/components/section-kicker";
import { SitePhoto } from "@/components/site-photo";
import { SiteVideo } from "@/components/site-video";
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
import { weekDays } from "@/db/schema";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";
import { getAboutVideoUrls } from "@/lib/site-settings";
import { youtubeVideoId } from "@/lib/video";
import {
  boardPhoto,
  historyAlbumPhotos,
  historyCentennialPhotos,
  historyFounderPhotos,
  historyMilestonePhotos,
  homePhotos,
  photoFor,
  schoolPhotos,
} from "@/lib/photos";

export const revalidate = 300;

const CENTENNIAL_ANCHOR = "centennial";

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

export default async function HomePage() {
  const [lang, dict, upcoming, groups, aboutVideoUrls] = await Promise.all([
    getLocale(),
    getDictionary(),
    getUpcomingEvents(5),
    getActiveGroups(),
    getAboutVideoUrls(),
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
    (slide, i) => {
      const src = homePhotos.schoolSlides[i];
      return src ? [{ ...slide, src }] : [];
    },
  );

  const schoolClasses = dict.school.classes.levels
    .map((level, i) => ({
      ...level,
      photo: photoFor(schoolPhotos.levels[i], level.photoAlt),
    }))
    .filter((level) => level.status === "");

  const milestones: Milestone[] = dict.home.history.milestones.map((step) => {
    const image = historyMilestonePhotos[step.id];
    return {
      year: step.year,
      era: step.era,
      title: step.title,
      text: step.text,
      photo: image ? { image, alt: step.photoAlt } : undefined,
      snapshots: dict.home.history.album.flatMap((item) => {
        const snapshot = historyAlbumPhotos[item.id];
        return item.milestoneId === step.id && snapshot
          ? [{ ...item, photo: { image: snapshot, alt: item.photoAlt } }]
          : [];
      }),
    };
  });

  const centennialGallery = dict.home.history.centennialGallery.flatMap((item) => {
    const image = historyCentennialPhotos[item.id];
    return image ? [{ image, alt: item.photoAlt }] : [];
  });

  const founders: Founder[] = dict.home.history.founders.flatMap((founder) => {
    const image = historyFounderPhotos[founder.id];
    return image
      ? [{ ...founder, photo: { image, alt: founder.photoAlt } }]
      : [];
  });

  return (
    <>
      <EventsHero events={upcoming} />

      <section
        id="groups"
        className="section-wash-groups edge-flush relative z-10 scroll-mt-28"
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

      <section
        id="school"
        className="section-midnight-scene seigaiha-rings seigaiha-rings-sky edge-flush scroll-mt-28 text-white"
      >
        <KanjiWatermark char="学" className="-top-14 -left-10 text-white/5" />
        <WaveDivider
          id="school-top"
          position="top"
          seed={12}
          className="relative text-cream"
        />
        <div className="relative mx-auto max-w-wide px-4 pt-6 pb-20 sm:px-6 sm:pb-24 lg:px-10 lg:pb-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
            <div className="reveal-rise lg:col-span-5">
              <div className="flex items-start justify-between gap-5">
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
                  <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/80">
                    {dict.home.japaneseSchool.body}
                  </p>
                </div>
                <div className="relative shrink-0">
                  <p
                    lang="ja"
                    className="school-plaque font-accent text-lg font-bold tracking-[0.16em] sm:text-xl"
                  >
                    {dict.home.japaneseSchool.plaque}
                  </p>
                  <span
                    aria-hidden="true"
                    className="reveal-pop absolute top-full left-1/2 z-10 -mt-3 size-18 -translate-x-1/2 -rotate-6 rounded-xs bg-magenta p-1 text-cream shadow-md sm:size-20"
                  >
                    <span className="flex h-full flex-col items-center justify-center border-2 border-cream/90 outline outline-1 -outline-offset-4 outline-cream/60">
                      <span className="font-accent text-xs leading-none font-bold tracking-[0.2em] uppercase">
                        {dict.home.japaneseSchool.sealAccent}
                      </span>
                      <span className="mt-1 font-accent text-lg leading-none font-bold sm:text-xl">
                        {dict.home.japaneseSchool.sealYear}
                      </span>
                    </span>
                  </span>
                </div>
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

          <ul className="reveal-stagger mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-20 lg:grid-cols-4">
            {dict.home.japaneseSchool.highlights.map((item, i) => (
              <li key={item.title} className="reveal-bloom">
                <figure className="relative aspect-square overflow-clip rounded-sm sm:aspect-card">
                  <SitePhoto
                    photo={photoFor(homePhotos.highlights[i], item.photoAlt)}
                    dark
                    sizes="(max-width: 1024px) 50vw, 24rem"
                    placeholderLabel={dict.home.photoSoon}
                    className="h-full w-full"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-deep via-ink-deep/85 to-transparent px-4 pt-14 pb-4 sm:px-5 sm:pb-5">
                    <span
                      lang={lang === "en" ? "ja" : "en"}
                      className="block font-accent text-sm font-bold tracking-[0.14em] text-sky sm:text-base"
                    >
                      {item.term}
                    </span>
                    <span className="mt-0.5 block font-display text-lg leading-tight font-semibold text-white sm:text-xl">
                      {item.title}
                    </span>
                    <span className="mt-1 hidden text-base leading-snug text-white/85 sm:block">
                      {item.text}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>

          <div className="mt-16 lg:mt-24">
            <div className="reveal-rise flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <SectionKicker
                  accent={dict.home.japaneseSchool.classesAccent}
                  caption={dict.home.japaneseSchool.classesCaption}
                  tone="sky"
                />
                <h3 className="mt-3 font-display text-3xl leading-snug font-normal tracking-[0.02em] text-white sm:text-4xl">
                  {dict.home.japaneseSchool.classesHeading}
                </h3>
                <p className="mt-2 text-lg text-white/80">
                  {dict.home.japaneseSchool.classesFacts}
                </p>
              </div>
              <Link
                href={`${href("/school")}#classes`}
                className="link-arrow py-2 font-display text-lg font-semibold text-sky hover:text-white"
              >
                {dict.home.japaneseSchool.classesCta}
              </Link>
            </div>
            <ol className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-6">
              {schoolClasses.map((level) => (
                <li key={level.name} className="reveal-rise">
                  <SitePhoto
                    photo={level.photo}
                    dark
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16rem"
                    placeholderLabel={dict.home.photoSoon}
                    className="aspect-photo rounded-sm"
                  />
                  <div className="mt-3 border-t-2 border-gold pt-2.5">
                    <span
                      lang="ja"
                      className="block font-accent text-xl font-bold tracking-[0.1em] text-sky"
                    >
                      {level.nameJa}
                    </span>
                    <span className="mt-0.5 block font-display text-base leading-snug font-semibold text-white">
                      {level.name}
                    </span>
                  </div>
                  <p className="mt-1 text-base leading-snug text-white/75">
                    {level.summary}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <BrushEdge
          id="school-bottom"
          variant="ink"
          settlesInto="white"
          className="absolute inset-x-0 bottom-0"
        />
      </section>

      <section
        id="history"
        className="section-wash-history relative scroll-mt-28 overflow-clip pb-12 sm:pb-14 lg:pb-16"
      >
        <KanjiWatermark char="和" className="-bottom-10 left-4 text-ink/5" />
        <div className="relative isolate overflow-clip">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 mask-t-from-75% mask-b-from-70%"
          >
            <div className="parallax-drift absolute inset-x-0 -inset-y-16">
              <Image
                src={homePhotos.eventsBackdrop}
                alt=""
                fill
                sizes="100vw"
                className="photo-develop object-cover"
              />
            </div>
            {/* At 88% the wash keeps every text color at AA over the darkest
                pixels of the photo; thin it and the kicker and captions fail. */}
            <div className="absolute inset-0 bg-paper/88" />
          </div>
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-24 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-10">
            <div className="lg:col-span-6">
              <div className="reveal-rise">
                <SectionKicker
                  accent={dict.home.history.kickerAccent}
                  caption={dict.home.history.kickerCaption}
                  tone="magenta"
                  size="lg"
                />
                <h2 className="mt-5 font-display text-4xl leading-tight font-normal tracking-[0.02em] sm:text-5xl 2xl:text-6xl">
                  <span className="block text-ink">
                    {dict.home.history.headingLine1}
                  </span>
                  <span className="block text-magenta">
                    {dict.home.history.headingLine2}
                  </span>
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-ink-soft">
                  {dict.home.history.body}
                </p>
                <p className="mt-8 border-l-2 border-magenta py-1 pl-5 font-display text-lg leading-relaxed text-ink italic">
                  <span className="block font-display text-sm font-semibold tracking-[0.14em] text-magenta uppercase not-italic">
                    {dict.home.history.missionLabel}
                  </span>
                  <span className="mt-1.5 block">
                    {dict.home.history.missionText}
                  </span>
                </p>
              </div>
            </div>

            <div className="mx-auto w-full max-w-3xl lg:col-span-6">
              <HistoryFounders
                label={dict.home.history.foundersLabel}
                founders={founders}
              />
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-wide px-4 pb-8 sm:px-6 lg:px-10">
          <HistoryTimeline
            milestones={milestones}
            photoLabel={dict.home.history.photoLabel}
            finalePhotoCaption={dict.home.history.centennialPhotoCaption}
            finaleId={CENTENNIAL_ANCHOR}
            className="mx-auto max-w-7xl"
          />
        </div>

        {centennialGallery.length > 0 && (
          <CentennialEmaki
            photos={centennialGallery}
            interludes={dict.home.history.centennialInterludes}
            copy={{
              ...dict.home.history.centennialStage,
              label: dict.home.history.centennialGalleryLabel,
            }}
            skipTo="#board"
            skipBackTo={`#${CENTENNIAL_ANCHOR}`}
          />
        )}

        <div
          id="board"
          className="relative mx-auto grid max-w-7xl scroll-mt-28 gap-10 px-4 pt-14 sm:px-6 sm:pt-18 lg:grid-cols-12 lg:items-center lg:gap-14 lg:px-10 lg:pt-24"
        >
          <div className="reveal-swing-left lg:col-span-7">
            <div className="flyer-mount relative">
              <div className="photo-develop">
                <Image
                  src={boardPhoto}
                  alt={dict.home.board.photoAlt}
                  sizes="(max-width: 1024px) calc(100vw - 4rem), 44rem"
                  placeholder="blur"
                />
              </div>
            </div>
          </div>
          <div className="reveal-rise lg:col-span-5">
            <SectionKicker
              accent={dict.home.board.kickerAccent}
              caption={dict.home.board.kickerCaption}
              tone="magenta"
              order="caption-first"
            />
            <h3 className="mt-4 font-display text-3xl leading-snug font-normal tracking-[0.02em] text-ink sm:text-4xl">
              {dict.home.board.title}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              {dict.home.board.intro}
            </p>
            <ul className="seigaiha-rings reveal-stagger-2 mt-7 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-line bg-mist px-6 py-6">
              {dict.home.board.members.map((name) => (
                <li key={name} className="reveal-rise flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="reveal-pop h-1.5 w-1.5 shrink-0 rounded-full bg-magenta"
                  />
                  <span className="font-display text-base font-medium text-ink">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-7 leading-relaxed text-ink-soft">
              {dict.home.board.volunteersNote}
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              {dict.home.board.note}{" "}
              <Link
                href={`${href("/")}#contact`}
                className="font-semibold text-indigo hover:text-indigo-deep"
              >
                {dict.home.board.noteLink}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {aboutVideoIds.length > 0 && (
        <section className="section-indigo-scene seigaiha-rings seigaiha-rings-sky text-white">
          <KanjiWatermark char="映" className="-top-10 -right-8 text-white/5" />
          <WaveDivider
            id="videos-top"
            position="top"
            seed={19}
            className="relative text-paper"
          />
          <div className="relative mx-auto max-w-wide px-4 pt-4 pb-22 sm:px-6 sm:pb-30 lg:px-10 lg:pb-40">
            <div className="reveal-rise mx-auto max-w-2xl text-center">
              <SectionKicker
                accent={dict.home.history.videosKickerAccent}
                caption={dict.home.history.videosKickerCaption}
                tone="photo"
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
      )}

      <div
        className={
          aboutVideoIds.length > 0
            ? "under-wave relative -mt-12 overflow-clip sm:-mt-20 lg:-mt-30"
            : "relative overflow-clip"
        }
      >
        <Image
          src={homePhotos.centennial}
          alt={dict.home.centennialPhotoAlt}
          width={2000}
          height={405}
          sizes="100vw"
          className="ken-burns-in block h-auto min-h-64 w-full object-cover object-bottom sm:min-h-80 lg:min-h-0"
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
                className="group flex flex-1 items-center gap-4 px-5 py-5 transition-colors hover:bg-mist"
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
                className="group flex flex-1 items-center gap-4 px-5 py-5 transition-colors hover:bg-mist"
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
                className="group flex flex-1 items-center gap-4 px-5 py-5 transition-colors hover:bg-mist"
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
