import type { Metadata } from "next";
import Image from "next/image";
import { DONATE_REASON_ICONS, HeartIcon } from "@/components/donate-icons";
import { DonationPanel } from "@/components/donation-panel";
import { ExternalLink } from "@/components/external-link";
import { HeroTitle } from "@/components/hero-title";
import { HeroPhotos } from "@/components/hero-photos";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { MailEnvelope } from "@/components/mail-envelope";
import { SectionHeading } from "@/components/section-heading";
import { SectionKicker } from "@/components/section-kicker";
import { StickyColumn } from "@/components/sticky-column";
import { WaveDivider } from "@/components/wave-divider";
import { ZeffyEmbed } from "@/components/zeffy-embed";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { ZEFFY_DONATION_URL, ZELLE_FALLBACK_EMAIL } from "@/lib/donate";
import { hasLocale, localePath } from "@/lib/i18n";
import { getCenterContact, getDonationDetails } from "@/lib/site-settings";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";

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

function ReasonPhoto({
  photo,
  Icon,
  className = "",
}: {
  photo: NonNullable<ReturnType<typeof slotPhoto>>;
  Icon: (typeof DONATE_REASON_ICONS)[number];
  className?: string;
}) {
  return (
    <div className={`relative overflow-clip rounded-sm ring-1 ring-gold/60 ${className}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(min-width: 1024px) 14rem, (min-width: 640px) 45vw, 100vw"
        className="object-cover"
      />
      <span className="absolute top-2 left-2 flex size-9 items-center justify-center rounded-full bg-ink-deep/85 text-sky ring-1 ring-gold/60">
        <Icon className="size-5" />
      </span>
    </div>
  );
}

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

export default async function PaymentsPage() {
  const [dict, lang, contact, donation, photos] = await Promise.all([
    getDictionary(),
    getLocale(),
    getCenterContact(),
    getDonationDetails(),
    getSitePhotos(),
  ]);

  const heroPhoto = slotPhoto(photos, "donate.hero", dict.payments.heroPhotoAlt, lang);
  const reasons = dict.payments.donateReasons.map((reason, i) => ({
    ...reason,
    photo: slotPhoto(photos, `donate.reason.${i}`, reason.photoAlt, lang),
  }));
  const mosaicPhotos = dict.payments.mosaicPhotoAlts.map((alt, i) =>
    slotPhoto(photos, `donate.mosaic.${i}`, alt ?? "", lang),
  );

  return (
    <>
      <section className="edge-flush section-midnight-scene relative isolate overflow-clip text-white">
        <div className="absolute inset-x-0 top-0 -z-10 h-page-hero">
          <Image
            src={heroPhoto.src}
            alt={heroPhoto.alt}
            fill
            preload
            fetchPriority="high"
            sizes="100vw"
            className="hero-intro-photo object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-ink-deep/90 via-navy/90 to-ink-deep/95 lg:bg-gradient-to-r lg:from-ink-deep/95 lg:via-navy/90 lg:via-60% lg:to-navy/10 lg:to-90%"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-ink-deep via-ink-deep/80 to-transparent"
          />
        </div>

        <div className="relative mx-auto max-w-wide px-5 pt-10 pb-32 sm:px-10 sm:pt-14 sm:pb-44 lg:flex lg:gap-12 lg:px-16 lg:pt-6">
          <StickyColumn className="lg:w-3/5" panelClassName="lg:top-36 scroll-mt-36">
            <div className="enter-stagger">
              <SectionKicker
                accent={dict.payments.kickerAccent}
                caption={dict.payments.kickerCaption}
                tone="photo"
                size="lg"
                entrance="load"
              />
              <HeroTitle
                compact
                line1={dict.payments.titleLine1}
                line2={dict.payments.titleLine2}
              />
              <p className="mt-4 font-display text-xl font-medium text-white">
                {dict.payments.lede}
              </p>
              <div className="mt-8 lg:hidden">
                <a
                  href="#donate"
                  className="button-donate inline-flex min-h-12 items-center rounded-lg px-7 py-3 font-display text-lg font-semibold text-white"
                >
                  {dict.payments.giveNow}
                </a>
              </div>
            </div>

            <section aria-labelledby="donate-reasons" className="mt-14 lg:mt-8">
              <h2
                id="donate-reasons"
                className="flex items-center gap-5 font-display text-2xl font-normal tracking-wide text-white"
              >
                <span className="shrink-0">{dict.payments.impactTitle}</span>
                <span aria-hidden="true" className="enter-rule h-px flex-1 bg-gold/60" />
              </h2>
              <div className="enter-stagger mt-6 hidden grid-cols-4 gap-3 lg:grid">
                {reasons.map((reason, i) =>
                  reason.photo ? (
                    <ReasonPhoto
                      key={reason.title}
                      photo={reason.photo}
                      Icon={DONATE_REASON_ICONS[i % DONATE_REASON_ICONS.length]}
                      className="aspect-square"
                    />
                  ) : (
                    <div key={reason.title} />
                  ),
                )}
              </div>
              <ol className="enter-stagger mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:mt-5 lg:gap-y-5">
                {reasons.map((reason, i) => {
                  const Icon = DONATE_REASON_ICONS[i % DONATE_REASON_ICONS.length];
                  return (
                    <li key={reason.title}>
                      {reason.photo && (
                        <ReasonPhoto
                          photo={reason.photo}
                          Icon={Icon}
                          className="mb-4 aspect-photo lg:hidden"
                        />
                      )}
                      <h3 className="flex items-center gap-2.5 font-display text-xl leading-snug font-normal text-white">
                        <Icon className="size-6 shrink-0 text-sky" />
                        {reason.title}
                      </h3>
                      <p className="mt-1.5 text-lg leading-snug text-white/85">{reason.text}</p>
                    </li>
                  );
                })}
              </ol>
            </section>
          </StickyColumn>

          <DonationPanel
            id="donate"
            className="mt-16 scroll-mt-36 lg:mt-0 lg:w-2/5"
            panelClassName="enter-rise flyer-mount relative scroll-mt-36 lg:top-36"
          >
            <div
              aria-hidden="true"
              className="seigaiha-rings seigaiha-rings-gold absolute inset-x-3.5 top-3.5 h-6"
            />
            <div className="relative flex items-center gap-4 px-3 pt-8 pb-5 sm:px-4">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-magenta text-cream shadow-md ring-4 ring-cream"
              >
                <HeartIcon className="size-6" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-3xl leading-tight font-light tracking-wide text-ink">
                  {dict.payments.formTitle}
                </h2>
                <p className="mt-0.5 text-base leading-snug text-ink-soft">
                  {dict.payments.formNote}
                </p>
              </div>
            </div>
            <div className="overflow-clip rounded-md ring-1 ring-gold/50">
              <ZeffyEmbed
                title={dict.payments.donateFrame}
                src={donation.donateFormUrl}
                className="block h-144 w-full bg-mist"
              />
            </div>
            <div className="space-y-1 px-4 pt-5 pb-2 text-center text-base leading-relaxed text-ink-soft">
              <p>
                {dict.payments.otherWaysBefore}
                <a
                  href="#other-ways"
                  className="link-arrow font-semibold text-indigo hover:text-indigo-deep"
                >
                  {dict.payments.otherWaysLink}
                </a>
              </p>
              <p>
                {dict.payments.donateTroubleBefore}
                <ExternalLink
                  href={ZEFFY_DONATION_URL}
                  className="font-semibold text-indigo hover:text-indigo-deep"
                >
                  {dict.payments.donateTroubleLink}
                </ExternalLink>
              </p>
            </div>
          </DonationPanel>
        </div>

        <WaveDivider id="payments-hero" seed={9} className="absolute inset-x-0 bottom-0 text-paper" />
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
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{dict.payments.donateIntro}</p>
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
                {donation.zelleRecipient ?? (
                  <>
                    {dict.payments.zelleBefore}
                    <a
                      href={`mailto:${ZELLE_FALLBACK_EMAIL}`}
                      className="font-semibold text-indigo hover:text-indigo-deep"
                    >
                      {ZELLE_FALLBACK_EMAIL}
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
                href={`mailto:${contact.email}`}
                className="font-semibold text-indigo hover:text-indigo-deep"
              >
                {contact.email}
              </a>
              {dict.payments.questionsAfter}
            </p>
          </div>

          <div className="reveal-rise lg:col-span-6">
            <h3 className="font-display text-2xl font-semibold text-ink">
              {dict.payments.checkTitle}
            </h3>
            <p className="mt-2 text-lg leading-relaxed text-ink-soft">
              {dict.payments.checkBefore}
              <strong className="text-ink">{donation.checkPayee}</strong>
              {dict.payments.checkAfter}
            </p>
            <div className="mt-6">
              <MailEnvelope>
                {donation.checkPayee}
                <br />
                {(() => {
                  const commaAt = donation.checkAddress.indexOf(", ");
                  const lines =
                    commaAt === -1
                      ? [donation.checkAddress]
                      : [
                          donation.checkAddress.slice(0, commaAt),
                          donation.checkAddress.slice(commaAt + 2),
                        ];
                  return lines.map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      {line}
                    </span>
                  ));
                })()}
              </MailEnvelope>
            </div>
            <p className="mt-6 text-base leading-relaxed text-ink-soft">{dict.payments.checkMemo}</p>
          </div>
        </div>
      </section>
    </>
  );
}
