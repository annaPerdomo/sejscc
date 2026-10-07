import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "@/components/external-link";
import { HeroPhotos } from "@/components/hero-photos";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PhotoHero } from "@/components/photo-hero";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { ZeffyEmbed } from "@/components/zeffy-embed";
import { CENTER_EMAIL } from "@/lib/center";
import { getDictionary, getDictionaryFor } from "@/lib/dictionaries";
import { ZEFFY_DONATION_EMBED_URL, ZEFFY_DONATION_URL } from "@/lib/donate";
import { hasLocale, localePath } from "@/lib/i18n";
import { donatePhotos, photoFor } from "@/lib/photos";

// The layout's announcement bar shows the next upcoming event; without this
// revalidation a past event would linger there until the next deploy.
export const revalidate = 300;

const MOSAIC_LAYOUT = [
  "col-span-2 aspect-photo sm:row-span-2 sm:aspect-auto",
  "aspect-square",
  "aspect-square",
  "aspect-square",
  "aspect-square",
  "col-span-2 aspect-band sm:col-span-4 sm:aspect-auto sm:h-112",
];
const MOSAIC_SIZES = [
  "(max-width: 640px) 100vw, 50vw",
  "(max-width: 640px) 50vw, 25vw",
  "(max-width: 640px) 50vw, 25vw",
  "(max-width: 640px) 50vw, 25vw",
  "(max-width: 640px) 50vw, 25vw",
  "100vw",
];

const STACK_TOPS = ["top-28", "top-32", "top-36", "top-40"];
// The formal numerals: a lone 一 or 二 at this size reads as a rule.
const NUMERALS = ["壱", "弐", "参", "肆", "伍", "陸"];

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.payments.metaTitle,
    description: dict.payments.metaDescription,
    alternates: {
      canonical: localePath(lang, "/payments"),
      languages: {
        en: "/payments",
        ja: "/ja/payments",
        "x-default": "/payments",
      },
    },
  };
}

// Set to null to show the fallback message below if the embed ever needs to come down.
const DONATION_EMBED_URL: string | null = ZEFFY_DONATION_EMBED_URL;

// TODO(launch): the recipient name + email/phone shown in the center's banking app.
const ZELLE_RECIPIENT: string | null = null;

export default async function PaymentsPage() {
  const dict = await getDictionary();

  const reasons = dict.payments.donateReasons.map((reason, i) => ({
    ...reason,
    photo: donatePhotos.reasons[i],
  }));
  const mosaicPhotos = donatePhotos.mosaic.map((src, i) =>
    photoFor(src, dict.payments.mosaicPhotoAlts[i] ?? ""),
  );

  return (
    <>
      <PhotoHero
        id="payments"
        photo={donatePhotos.hero}
        photoAlt={dict.payments.heroPhotoAlt}
        accent={dict.payments.kickerAccent}
        caption={dict.payments.kickerCaption}
        titleLine1={dict.payments.titleLine1}
        titleLine2={dict.payments.titleLine2}
        settlesInto="paper"
        lede={
          <>
            <p className="font-display text-xl font-medium text-white sm:text-2xl">
              {dict.payments.lede}
            </p>
            <p className="mt-5">{dict.payments.donateIntro}</p>
          </>
        }
        aside={
          <div id="donate" className="scroll-mt-32">
            <div className="overflow-clip rounded-sm bg-white shadow-2xl ring-4 ring-gold/70">
              {DONATION_EMBED_URL ? (
                <ZeffyEmbed
                  title={dict.payments.donateFrame}
                  src={DONATION_EMBED_URL}
                  className="h-144 min-h-144 w-full lg:h-136 lg:min-h-136"
                />
              ) : (
                <div className="p-8 text-ink-soft">
                  <p className="font-display text-xl font-semibold text-ink">
                    {dict.payments.donateSoon}
                  </p>
                  <p className="mt-3 text-lg leading-relaxed">
                    {dict.payments.donateSoonBefore}
                    <a
                      href={`mailto:${CENTER_EMAIL}`}
                      className="font-semibold text-indigo hover:text-indigo-deep"
                    >
                      {CENTER_EMAIL}
                    </a>
                    {dict.payments.donateSoonAfter}
                  </p>
                </div>
              )}
              {DONATION_EMBED_URL && (
                <p className="border-t border-line px-6 py-4 text-base text-ink-soft">
                  {dict.payments.donateTroubleBefore}
                  <ExternalLink
                    href={ZEFFY_DONATION_URL}
                    className="font-semibold text-indigo hover:text-indigo-deep"
                  >
                    {dict.payments.donateTroubleLink}
                  </ExternalLink>
                </p>
              )}
            </div>
          </div>
        }
      />

      <section className="relative bg-paper">
        <div className="reveal-rise mx-auto max-w-3xl px-5 pt-12 pb-14 text-center sm:px-10 sm:pt-16">
          <SectionHeading className="sm:text-5xl">{dict.payments.impactTitle}</SectionHeading>
        </div>
        <div className="pb-1">
          {reasons.map((reason, i) => (
            <article
              key={reason.title}
              className={`isolate flex min-h-stack-panel lg:tall:sticky flex-col border-t-4 border-gold bg-ink-deep text-white shadow-2xl ${
                STACK_TOPS[i % STACK_TOPS.length]
              }`}
            >
              {reason.photo && (
                <Image
                  src={reason.photo}
                  alt={reason.photoAlt}
                  fill
                  sizes="100vw"
                  className="-z-10 object-cover"
                />
              )}
              {/* The copy sits at the top, so the next panel covers the photo
                  before the words; this keeps it at AA over the photo. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-deep from-10% via-ink-deep/90 via-55% to-ink-deep/80 lg:bg-gradient-to-r lg:from-ink-deep/95 lg:from-0% lg:via-ink-deep/85 lg:via-50% lg:to-transparent lg:to-80%"
              />
              <div className="mx-auto w-full max-w-wide px-5 pt-12 pb-16 sm:px-10 sm:pt-16 lg:px-16 lg:pt-20">
                <div className="max-w-2xl">
                  <span
                    lang="ja"
                    aria-hidden="true"
                    className="block font-accent text-7xl leading-none font-bold text-sky sm:text-8xl"
                  >
                    {NUMERALS[i % NUMERALS.length]}
                  </span>
                  <h3 className="mt-5 font-display text-4xl leading-tight font-normal sm:text-5xl">
                    {reason.title}
                  </h3>
                  <p className="mt-4 text-lg leading-relaxed text-white/90 sm:text-xl">
                    {reason.text}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-clip bg-paper pt-20 pb-1 sm:pt-28">
        <KanjiWatermark char="縁" className="-top-10 -right-14 text-indigo/5" />
        <div className="reveal-rise relative mx-auto max-w-3xl px-5 text-center sm:px-10">
          <SectionKicker
            accent={dict.payments.mosaicAccent}
            caption={dict.payments.mosaicCaption}
            size="lg"
            className="justify-center"
          />
          <SectionHeading className="mt-4 sm:text-5xl">{dict.payments.mosaicTitle}</SectionHeading>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{dict.payments.mosaicText}</p>
        </div>
        <HeroPhotos
          layout={MOSAIC_LAYOUT}
          photos={mosaicPhotos}
          sizes={MOSAIC_SIZES}
          tileClassName="w-full"
          placeholderLabel={dict.payments.photoLabel}
          revealOnScroll
          className="relative mt-14 grid grid-cols-2 gap-1 sm:grid-cols-4"
        />
      </section>

      <section
        id="other-ways"
        className="seigaiha-rings seigaiha-rings-fade relative scroll-mt-28 bg-mist py-20 sm:py-28"
      >
        <div className="relative mx-auto grid max-w-wide gap-14 px-5 sm:px-10 lg:grid-cols-12 lg:items-center lg:px-16">
          <div className="reveal-rise lg:col-span-6">
            <SectionKicker
              accent={dict.payments.otherAccent}
              caption={dict.payments.otherCaption}
              size="lg"
            />
            <SectionHeading className="mt-4 sm:text-5xl">{dict.payments.otherTitle}</SectionHeading>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">{dict.payments.otherText}</p>

            <div className="mt-10 border-l-4 border-indigo pl-6">
              <h3 className="font-display text-2xl font-semibold text-ink">
                {dict.payments.zelleTitle}
              </h3>
              <p className="mt-2 text-lg leading-relaxed text-ink-soft">
                {dict.payments.zelleText}
              </p>
              <p className="mt-3 text-lg leading-relaxed text-ink">
                {ZELLE_RECIPIENT ?? (
                  <>
                    {dict.payments.zelleBefore}
                    <a
                      href="mailto:gakuen@sejscc.org"
                      className="font-semibold text-indigo hover:text-indigo-deep"
                    >
                      gakuen@sejscc.org
                    </a>
                    {dict.payments.zelleAfter}
                  </>
                )}
              </p>
              <p className="mt-3 text-base leading-relaxed text-ink-soft">
                {dict.payments.zelleMemo}
              </p>
            </div>

            <p className="mt-10 text-lg leading-relaxed text-ink-soft">
              {dict.payments.questionsBefore}
              <a
                href={`mailto:${CENTER_EMAIL}`}
                className="font-semibold text-indigo hover:text-indigo-deep"
              >
                {CENTER_EMAIL}
              </a>
              {dict.payments.questionsAfter}
            </p>
          </div>

          <div className="reveal-swing-right lg:col-span-6">
            <div className="envelope flex flex-col gap-8 p-7 sm:p-10">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-ink">
                    {dict.payments.checkTitle}
                  </h3>
                  <p className="mt-2 text-lg leading-relaxed text-ink-soft">
                    {dict.payments.checkBefore}
                    <strong className="text-ink">SEJSCC</strong>
                    {dict.payments.checkAfter}
                  </p>
                </div>
                <span
                  lang="ja"
                  aria-hidden="true"
                  className="flex h-20 w-16 shrink-0 rotate-3 items-center justify-center bg-magenta font-accent text-3xl font-bold text-cream outline-2 -outline-offset-4 outline-cream/80 outline-dashed"
                >
                  縁
                </span>
              </div>
              <p className="mx-auto font-display text-2xl leading-relaxed text-ink sm:text-3xl sm:leading-relaxed">
                SEJSCC
                <br />
                14615 S. Gridley Rd.
                <br />
                Norwalk, CA 90650
              </p>
              <p className="text-base leading-relaxed text-ink-soft">{dict.payments.checkMemo}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
