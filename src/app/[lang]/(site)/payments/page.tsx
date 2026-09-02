import type { Metadata } from "next";
import { ExternalLink } from "@/components/external-link";
import { HeroPhotos } from "@/components/hero-photos";
import { PageHero } from "@/components/page-hero";
import { PageSection } from "@/components/page-section";
import { SitePhoto } from "@/components/site-photo";
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
  "col-span-2 aspect-band sm:col-span-4",
];
const MOSAIC_SIZES = [
  "(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 34rem",
  "(max-width: 640px) 46vw, (max-width: 1024px) 23vw, 17rem",
  "(max-width: 640px) 46vw, (max-width: 1024px) 23vw, 17rem",
  "(max-width: 640px) 46vw, (max-width: 1024px) 23vw, 17rem",
  "(max-width: 640px) 46vw, (max-width: 1024px) 23vw, 17rem",
  "(max-width: 1024px) 92vw, 70rem",
];

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
    photo: photoFor(donatePhotos.reasons[i], reason.photoAlt),
  }));
  const mosaicPhotos = donatePhotos.mosaic.map((src, i) =>
    photoFor(src, dict.payments.mosaicPhotoAlts[i] ?? ""),
  );

  return (
    <>
      <PageHero
        id="payments"
        wash="section-wash-payments-hero"
        watermark="志"
        watermarkClassName="-bottom-24 -left-10 text-indigo/5"
        accent={dict.payments.kickerAccent}
        caption={dict.payments.kickerCaption}
        titleLine1={dict.payments.titleLine1}
        titleLine2={dict.payments.titleLine2}
        lede={dict.payments.lede}
        settlesInto="azure"
        tight
        below={
          <div
            id="donate"
            className="grid scroll-mt-28 gap-8 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-start lg:gap-10"
          >
            <div className="lg:order-2">
              <div className="surface-card overflow-clip">
                {DONATION_EMBED_URL ? (
                  <ZeffyEmbed
                    title={dict.payments.donateFrame}
                    src={DONATION_EMBED_URL}
                    className="h-144 min-h-144 w-full lg:h-136 lg:min-h-136"
                  />
                ) : (
                  <div className="p-8 text-ink-soft">
                    <p className="font-display text-lg font-semibold text-ink">
                      {dict.payments.donateSoon}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
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
              </div>

              {DONATION_EMBED_URL && (
                <p className="mt-4 text-sm text-ink-soft">
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

            <div className="lg:order-1">
              <p className="max-w-2xl leading-relaxed text-ink-soft">
                {dict.payments.donateIntro}
              </p>
              <h2 className="mt-8 font-display text-2xl font-semibold text-ink">
                {dict.payments.impactTitle}
              </h2>
              <ul className="mt-6 flex flex-col gap-6">
                {reasons.map((reason) => (
                  <li key={reason.title} className="flex items-center gap-5">
                    <SitePhoto
                      photo={reason.photo}
                      sizes="(max-width: 640px) 7rem, (max-width: 1024px) 9rem, 10rem"
                      placeholderLabel={dict.payments.photoLabel}
                      className="aspect-square w-28 shrink-0 rounded-lg border border-line shadow-sm sm:w-36 lg:w-40"
                    />
                    <div>
                      <h3 className="font-display leading-snug font-semibold text-ink">
                        {reason.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                        {reason.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />

      <PageSection
        surface="azure"
        watermark="縁"
        watermarkClassName="-top-20 -right-14 text-indigo/5"
        accent={dict.payments.mosaicAccent}
        caption={dict.payments.mosaicCaption}
        title={dict.payments.mosaicTitle}
        lede={dict.payments.mosaicText}
      >
        <HeroPhotos
          layout={MOSAIC_LAYOUT}
          photos={mosaicPhotos}
          sizes={MOSAIC_SIZES}
          tileClassName="w-full rounded-md border border-line shadow-sm"
          placeholderLabel={dict.payments.photoLabel}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5"
        />
      </PageSection>

      <PageSection
        id="other-ways"
        surface="white"
        watermark="納"
        watermarkClassName="-right-12 -bottom-20 text-indigo/5"
        accent={dict.payments.otherAccent}
        caption={dict.payments.otherCaption}
        title={dict.payments.otherTitle}
        lede={dict.payments.otherText}
      >
        <div className="grid max-w-4xl gap-5 sm:grid-cols-2">
          <div className="surface-card reveal-rise p-6">
            <h3 className="font-display text-xl font-semibold text-ink">
              {dict.payments.zelleTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {dict.payments.zelleText}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
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
            <p className="mt-3 text-sm text-ink-soft">
              {dict.payments.zelleMemo}
            </p>
          </div>
          <div className="surface-card reveal-rise p-6">
            <h3 className="font-display text-xl font-semibold text-ink">
              {dict.payments.checkTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {dict.payments.checkBefore}
              <strong>SEJSCC</strong>
              {dict.payments.checkAfter}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              SEJSCC
              <br />
              14615 S. Gridley Rd.
              <br />
              Norwalk, CA 90650
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              {dict.payments.checkMemo}
            </p>
          </div>
        </div>

        <p className="reveal-rise mt-6 max-w-2xl text-sm text-ink-soft">
          {dict.payments.questionsBefore}
          <a
            href={`mailto:${CENTER_EMAIL}`}
            className="font-semibold text-indigo hover:text-indigo-deep"
          >
            {CENTER_EMAIL}
          </a>
          {dict.payments.questionsAfter}
        </p>
      </PageSection>
    </>
  );
}
