import Image, { type StaticImageData } from "next/image";
import { KanjiWatermark } from "@/components/kanji-watermark";

export type EmakiPhoto = { image: StaticImageData; alt: string };
export type EmakiInterlude = { kanji: string; caption: string };

export type EmakiCopy = {
  label: string;
  titleAccent: string;
  title: string;
  dates: string;
  skip: string;
};

export function CentennialEmaki({
  photos,
  interludes,
  copy,
  skipTo,
}: {
  photos: EmakiPhoto[];
  interludes: EmakiInterlude[];
  copy: EmakiCopy;
  skipTo: string;
}) {
  const scenes = splitIntoScenes(photos, Math.max(interludes.length - 1, 1));
  const closing = interludes.length > 1 ? interludes[interludes.length - 1] : undefined;
  return (
    <div className="emaki section-midnight-scene seigaiha-rings seigaiha-rings-gold">
      <div className="emaki-stage">
        <KanjiWatermark char="百" className="inset-x-0 top-1/4 text-center text-gold/10" />

        <div className="relative flex items-start justify-between gap-6 px-4 sm:px-8 lg:px-12">
          <div>
            {copy.titleAccent && (
              <p lang="ja" className="font-accent text-base font-bold tracking-[0.3em] text-sky sm:text-lg">
                {copy.titleAccent}
              </p>
            )}
            <h3 className="mt-1 font-display text-2xl leading-tight font-normal tracking-[0.02em] text-white sm:text-3xl">
              {copy.title}
            </h3>
            <p className="mt-1 font-display text-sm font-semibold tracking-[0.2em] text-sky">
              {copy.dates}
            </p>
          </div>
          <a
            href={skipTo}
            className="button-light shrink-0 rounded-full px-5 py-3 font-display text-sm font-semibold"
          >
            {copy.skip}
            <span aria-hidden="true"> ↓</span>
          </a>
        </div>

        <div
          role="region"
          aria-label={copy.label}
          tabIndex={0}
          className="emaki-track relative focus-visible:outline-2 focus-visible:outline-gold"
        >
          <div className="emaki-band">
            <ul className="emaki-strip">
              {scenes.map((scene, i) => (
                <SceneItems key={i} scene={scene} interlude={interludes[i]} />
              ))}
              {closing && <InterludeItem interlude={closing} />}
            </ul>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="relative px-4 sm:px-8 lg:px-12"
        >
          <div className="h-0.5 bg-white/15">
            <div className="emaki-progress h-full bg-gold" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneItems({
  scene,
  interlude,
}: {
  scene: EmakiPhoto[];
  interlude?: EmakiInterlude;
}) {
  return (
    <>
      {interlude && <InterludeItem interlude={interlude} />}
      {scene.map((photo) => (
        <li key={photo.image.src} className="shrink-0">
          <Image
            src={photo.image}
            alt={photo.alt}
            sizes="(max-width: 640px) 110vw, 64rem"
            placeholder="blur"
            // Pinned, the band pans photos in from outside the clipped track,
            // so lazy loading never sees them intersect and leaves them blank.
            loading="eager"
            className="emaki-photo"
          />
        </li>
      ))}
    </>
  );
}

function InterludeItem({ interlude }: { interlude: EmakiInterlude }) {
  if (!interlude.kanji) {
    return (
      <li className="flex shrink-0 flex-col items-center justify-center gap-5 px-4 sm:px-8">
        <span aria-hidden="true" className="h-px w-10 bg-gold" />
        <p className="max-w-52 text-center font-display text-2xl leading-snug font-normal tracking-[0.02em] text-ink sm:text-3xl">
          {interlude.caption}
        </p>
        <span aria-hidden="true" className="h-px w-10 bg-gold" />
      </li>
    );
  }
  return (
    <li className="flex shrink-0 flex-col items-center justify-center gap-5 px-4 sm:px-8">
      <p
        lang="ja"
        className="writing-vertical font-accent text-3xl font-bold tracking-[0.25em] text-ink sm:text-4xl"
      >
        {interlude.kanji}
      </p>
      <span aria-hidden="true" className="h-px w-10 bg-gold" />
      <p className="max-w-40 text-center font-display text-sm leading-snug tracking-[0.06em] text-ink-soft">
        {interlude.caption}
      </p>
    </li>
  );
}

function splitIntoScenes(photos: EmakiPhoto[], count: number): EmakiPhoto[][] {
  const size = Math.ceil(photos.length / count);
  return Array.from({ length: count }, (_, i) => photos.slice(i * size, (i + 1) * size));
}
