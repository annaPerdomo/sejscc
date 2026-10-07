import Image, { type StaticImageData } from "next/image";
import { PhotoPlaceholder } from "@/components/photo-placeholder";

type TimelinePhoto = { image: StaticImageData; alt: string };

type Snapshot = {
  id: string;
  year: string;
  text: string;
  photo: TimelinePhoto;
};

export type Milestone = {
  year: string;
  era: string;
  title: string;
  text: string;
  photo?: TimelinePhoto;
  snapshots: Snapshot[];
};

export function HistoryTimeline({
  milestones,
  photoLabel,
  finalePhotoCaption,
  finaleId,
  className = "",
}: {
  milestones: Milestone[];
  photoLabel: string;
  finalePhotoCaption: string;
  finaleId: string;
  className?: string;
}) {
  const lastIndex = milestones.length - 1;
  return (
    <ol className={className}>
      {milestones.map((milestone, i) =>
        i === lastIndex && i > 0 ? (
          <FinaleMilestone
            key={milestone.year}
            milestone={milestone}
            photoCaption={finalePhotoCaption}
            id={finaleId}
          />
        ) : (
          <TimelineMilestone
            key={milestone.year}
            milestone={milestone}
            photoLabel={photoLabel}
            isFirst={i === 0}
            photoOnTheRight={i % 2 === 1}
          />
        ),
      )}
    </ol>
  );
}

function TimelineMilestone({
  milestone,
  photoLabel,
  isFirst,
  photoOnTheRight,
}: {
  milestone: Milestone;
  photoLabel: string;
  isFirst: boolean;
  photoOnTheRight: boolean;
}) {
  const photoSide = photoOnTheRight
    ? "reveal-swing-right lg:col-start-2 lg:row-start-1 lg:justify-start"
    : "reveal-swing-left lg:col-start-1 lg:row-start-1 lg:justify-end";
  return (
    <li className="relative pb-20 pl-16 sm:pb-24 lg:grid lg:grid-cols-2 lg:gap-x-28 lg:pb-32 lg:pl-0">
      <TimelineRail className={isFirst ? "top-6 bottom-0 sm:top-8" : "inset-y-0"} />
      <TimelineMarker
        tickSide={photoOnTheRight ? "start" : "end"}
        className="top-6 sm:top-8"
      />
      <RailEraLabel era={milestone.era} className="top-16" />

      <span
        aria-hidden="true"
        className={`watermark-drift pointer-events-none absolute -top-10 hidden font-display text-9xl font-light tracking-tight text-ink/5 select-none lg:block ${
          photoOnTheRight ? "right-0" : "left-0"
        }`}
      >
        {milestone.year}
      </span>

      <div
        className={`reveal-rise relative flex gap-5 lg:pt-1 ${
          photoOnTheRight
            ? "lg:col-start-1 lg:row-start-1 lg:flex-row-reverse lg:text-right"
            : "lg:col-start-2 lg:row-start-1"
        }`}
      >
        <EraLabel
          era={milestone.era}
          className="hidden border-x border-gold/60 px-1.5 py-1 text-lg lg:block"
        />
        <div className="min-w-0">
          <MilestoneHeading milestone={milestone} alignEnd={photoOnTheRight} />
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{milestone.text}</p>
        </div>
      </div>

      <div className={`relative mt-8 lg:mt-16 lg:flex lg:items-start ${photoSide}`}>
        <MilestonePhotos milestone={milestone} photoLabel={photoLabel} />
      </div>
    </li>
  );
}

function FinaleMilestone({
  milestone,
  photoCaption,
  id,
}: {
  milestone: Milestone;
  photoCaption: string;
  id?: string;
}) {
  return (
    <li className="relative pt-2">
      <TimelineRail className="top-0 h-6" />
      <TimelineMarker finale className="top-6" />

      <div className="relative left-1/2 mt-14 grid w-screen -translate-x-1/2 overflow-clip bg-ink-deep lg:mt-20">
        <div className="sticky top-0 col-start-1 row-start-1 h-svh self-start">
          <div className="absolute inset-x-0 top-28 bottom-0 lg:top-30">
            {milestone.photo && (
              <Image
                src={milestone.photo.image}
                alt={milestone.photo.alt}
                fill
                sizes="100vw"
                placeholder="blur"
                className="object-cover"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-radial from-transparent from-45% to-ink-deep/85"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-ink-deep to-transparent"
            />
            <div aria-hidden="true" className="absolute inset-3 border-2 border-gold sm:inset-5">
              <div className="absolute inset-1.5 border border-gold/50" />
            </div>
            {/* Sits on the solid end of the bottom fade, where white clears AA
                over the paper flowers behind it. */}
            <p className="absolute inset-x-0 bottom-8 px-8 text-center font-display text-sm font-semibold tracking-[0.2em] text-white uppercase sm:bottom-10">
              {photoCaption}
            </p>
          </div>
        </div>

        {/* At the text this wash is just dark enough for blossom and white to
            clear AA over the white sign. */}
        <div className="relative col-start-1 row-start-1 flex flex-col">
          <div aria-hidden="true" className="h-svh shrink-0" />
          <div
            id={id}
            className="flex min-h-svh flex-col justify-center bg-linear-to-b from-transparent via-ink-deep/80 via-25% to-ink-deep/90 px-4 pt-24 pb-24 text-center sm:px-6"
          >
            <div className="reveal-rise mx-auto max-w-3xl">
              {milestone.era && (
                <p
                  lang="ja"
                  aria-hidden="true"
                  className="font-accent text-xl font-bold tracking-[0.4em] text-sky"
                >
                  {milestone.era}
                </p>
              )}
              <MilestoneHeading milestone={milestone} centered />
              <p className="mt-4 text-lg leading-relaxed text-white lg:text-xl">
                {milestone.text}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function TimelineRail({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute left-6 w-px -translate-x-1/2 bg-gold/45 lg:left-1/2 ${className}`}
    >
      <span className="timeline-fill absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-linear-to-b from-magenta to-magenta-deep" />
    </span>
  );
}

function TimelineMarker({
  tickSide,
  finale = false,
  className,
}: {
  tickSide?: "start" | "end";
  finale?: boolean;
  className: string;
}) {
  return (
    <span aria-hidden="true" className={`absolute left-6 lg:left-1/2 ${className}`}>
      {tickSide && (
        <span
          className={`timeline-tick absolute top-0 left-0 h-0.5 w-8 -translate-y-1/2 origin-left bg-gold lg:w-12 ${
            tickSide === "start" ? "lg:right-0 lg:left-auto lg:origin-right" : ""
          }`}
        />
      )}
      <span
        className={`timeline-dot absolute top-0 left-0 -translate-1/2 rounded-full bg-magenta ring-4 ring-paper ${
          finale ? "size-5" : "size-3.5"
        }`}
      />
    </span>
  );
}

function EraLabel({ era, className }: { era: string; className: string }) {
  if (!era) return null;
  return (
    <p
      lang="ja"
      aria-hidden="true"
      className={`writing-vertical shrink-0 font-accent font-bold tracking-[0.3em] text-ink-soft ${className}`}
    >
      {era}
    </p>
  );
}

function RailEraLabel({ era, className }: { era: string; className: string }) {
  return (
    <EraLabel
      era={era}
      className={`absolute left-6 -translate-x-1/2 bg-paper py-2 text-base lg:hidden ${className}`}
    />
  );
}

function MilestoneHeading({
  milestone,
  alignEnd = false,
  centered = false,
}: {
  milestone: Milestone;
  alignEnd?: boolean;
  centered?: boolean;
}) {
  const ruleAlignment = centered ? "mx-auto origin-center" : alignEnd ? "lg:ml-auto lg:origin-right" : "";
  return (
    <>
      <p
        className={`ink-bleed font-display leading-none whitespace-nowrap font-light tracking-[0.04em] ${
          centered ? "mt-2 text-7xl text-blossom sm:text-8xl lg:text-9xl" : "text-5xl text-magenta sm:text-6xl"
        }`}
      >
        {milestone.year}
      </p>
      <span
        aria-hidden="true"
        className={`reveal-rule mt-4 block h-0.5 w-16 bg-gold ${ruleAlignment}`}
      />
      <h3
        className={`mt-4 font-display leading-snug font-normal tracking-[0.02em] ${
          centered ? "text-3xl text-white sm:text-4xl" : "text-2xl text-ink sm:text-3xl"
        }`}
      >
        {milestone.title}
      </h3>
    </>
  );
}

function MilestonePhotos({
  milestone,
  photoLabel,
}: {
  milestone: Milestone;
  photoLabel: string;
}) {
  if (!milestone.photo) {
    return (
      <PhotoPlaceholder
        label={photoLabel}
        className="aspect-band w-full bg-paper p-2 shadow-lg"
      />
    );
  }
  if (milestone.snapshots.length === 0) {
    // Intrinsic size on purpose: the scans run from a 5:1 panorama to a small
    // portrait, and a shared frame would crop or upscale them past legibility.
    return (
      <div className="flyer-mount relative w-fit">
        <div className="photo-develop relative overflow-clip">
          <Image
            src={milestone.photo.image}
            alt={milestone.photo.alt}
            sizes="(max-width: 1024px) calc(100vw - 6rem), 40rem"
            placeholder="blur"
            className="ken-burns-in"
          />
        </div>
      </div>
    );
  }
  return <MilestoneCollage photo={milestone.photo} snapshots={milestone.snapshots} />;
}

const COLLAGE_LAYOUTS: Record<number, { main: string; snapshot: string }> = {
  1: {
    main: "col-span-12 sm:col-span-7",
    snapshot: "col-span-12 aspect-photo sm:col-span-5 sm:aspect-card",
  },
  2: {
    main: "col-span-12 sm:col-span-8 sm:row-span-2",
    snapshot: "col-span-6 aspect-photo sm:col-span-4",
  },
};

function MilestoneCollage({
  photo,
  snapshots,
}: {
  photo: TimelinePhoto;
  snapshots: Snapshot[];
}) {
  const layout = COLLAGE_LAYOUTS[snapshots.length] ?? COLLAGE_LAYOUTS[2];
  return (
    <div className="flyer-mount relative w-full">
      <div className="reveal-stagger-3 photo-develop relative grid grid-cols-12 gap-2 sm:gap-3">
        <div className={`reveal-bloom relative overflow-clip ${layout.main}`}>
          <Image
            src={photo.image}
            alt={photo.alt}
            sizes="(max-width: 640px) calc(100vw - 6rem), (max-width: 1024px) 60vw, 26rem"
            placeholder="blur"
            className="ken-burns-in h-auto w-full sm:absolute sm:inset-0 sm:h-full sm:object-cover"
          />
        </div>
        {snapshots.map((snapshot, i) => (
          <div
            key={snapshot.id}
            className={`reveal-bloom relative overflow-clip ${layout.snapshot}`}
          >
            <Image
              src={snapshot.photo.image}
              alt={snapshot.photo.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 14rem"
              placeholder="blur"
              className="object-cover"
            />
            <CollageNumber n={i + 1} className="absolute top-2 left-2" />
          </div>
        ))}
      </div>
      <ol className="relative mt-4 space-y-2.5 border-t border-gold/40 pt-4">
        {snapshots.map((snapshot, i) => (
          <li key={snapshot.id} className="flex gap-3 text-left text-base leading-snug text-ink-soft">
            <CollageNumber n={i + 1} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-display font-bold text-magenta">{snapshot.year}</span>{" "}
              {snapshot.text}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CollageNumber({ n, className }: { n: number; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-6 place-items-center rounded-sm bg-magenta font-display text-sm font-semibold text-white ${className}`}
    >
      {n}
    </span>
  );
}

