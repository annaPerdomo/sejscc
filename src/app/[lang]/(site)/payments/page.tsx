import type { Metadata } from "next";
import { ExternalLink } from "@/components/external-link";
import { PageHero } from "@/components/page-hero";
import { PageSection } from "@/components/page-section";
import { SitePhoto } from "@/components/site-photo";
import { getDictionary, getDictionaryFor } from "@/lib/dictionaries";
import { ZEFFY_DONATION_EMBED_URL, ZEFFY_DONATION_URL } from "@/lib/donate";
import { hasLocale, localePath } from "@/lib/i18n";
import { photoFor, paymentsHeroPhotos } from "@/lib/photos";

// The layout's announcement bar shows the next upcoming event; without this
// revalidation a past event would linger there until the next deploy.
export const revalidate = 300;

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

  const heroPhoto = photoFor(
    paymentsHeroPhotos[0],
    dict.payments.heroPhotoAlts[0] ?? ""
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
        actions={
          <>
            <a
              href="#donate"
              className="button-donate rounded-lg px-6 py-3.5 font-display text-sm font-semibold text-white"
            >
              {dict.payments.donateCta}
            </a>
            <a
              href="#dues"
              className="font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
            >
              {dict.payments.duesCta}
            </a>
          </>
        }
        media={
          <SitePhoto
            photo={heroPhoto}
            preload
            sizes="(max-width: 640px) 92vw, 28rem"
            placeholderLabel={dict.payments.photoLabel}
            className="reveal-rise aspect-flyer w-full max-w-sm rounded-xl border-4 border-white shadow-lg lg:w-80 lg:max-w-none xl:w-96"
          />
        }
      />

      <PageSection
        id="dues"
        surface="white"
        watermark="納"
        watermarkClassName="-right-12 -bottom-20 text-indigo/5"
        accent={dict.payments.duesAccent}
        caption={dict.payments.duesCaption}
        title={dict.payments.duesTitle}
        lede={dict.payments.duesText}
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
            <p className="mt-3 text-sm text-ink-soft">{dict.payments.zelleMemo}</p>
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
            <p className="mt-3 text-sm text-ink-soft">{dict.payments.checkMemo}</p>
          </div>
        </div>

        <p className="reveal-rise mt-6 max-w-2xl text-sm text-ink-soft">
          {dict.payments.questionsBefore}
          <a
            href="mailto:gakuen@sejscc.org"
            className="font-semibold text-indigo hover:text-indigo-deep"
          >
            gakuen@sejscc.org
          </a>
          {dict.payments.questionsAfter}
        </p>
      </PageSection>

      <PageSection
        id="donate"
        surface="mist"
        watermark="寄"
        watermarkClassName="top-40 -right-16 text-magenta/5"
        accent={dict.payments.donateAccent}
        caption={dict.payments.donateCaption}
        title={dict.payments.donateTitle}
        lede={dict.payments.donateText}
      >
        <div className="reveal-rise mb-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dict.payments.donateReasons.map((reason) => (
            <div key={reason.title} className="surface-card flex flex-col p-5">
              <span aria-hidden="true" className="block h-0.5 w-8 bg-magenta" />
              <h3 className="mt-3 font-display text-lg leading-snug font-semibold text-ink">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {reason.text}
              </p>
            </div>
          ))}
        </div>

        <div className="surface-card reveal-rise max-w-3xl overflow-clip">
          {DONATION_EMBED_URL ? (
            <iframe
              title={dict.payments.donateFrame}
              src={DONATION_EMBED_URL}
              loading="lazy"
              className="h-160 w-full"
              allow="payment"
            />
          ) : (
            <div className="p-8 text-ink-soft">
              <p className="font-display text-lg font-semibold text-ink">
                {dict.payments.donateSoon}
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                {dict.payments.donateSoonBefore}
                <a
                  href="mailto:info@sejscc.org"
                  className="font-semibold text-indigo hover:text-indigo-deep"
                >
                  info@sejscc.org
                </a>
                {dict.payments.donateSoonAfter}
              </p>
            </div>
          )}
        </div>

        {DONATION_EMBED_URL && (
          <p className="reveal-rise mt-4 max-w-3xl text-sm text-ink-soft">
            {dict.payments.donateTroubleBefore}
            <ExternalLink
              href={ZEFFY_DONATION_URL}
              className="font-semibold text-indigo hover:text-indigo-deep"
            >
              {dict.payments.donateTroubleLink}
            </ExternalLink>
          </p>
        )}
      </PageSection>
    </>
  );
}
