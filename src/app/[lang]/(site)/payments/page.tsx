import type { Metadata } from "next";
import { HeroPhotos } from "@/components/hero-photos";
import { PageHero } from "@/components/page-hero";
import { PageSection } from "@/components/page-section";
import { getDictionary, getDictionaryFor } from "@/lib/dictionaries";
import { ZEFFY_DONATION_URL } from "@/lib/donate";
import { hasLocale, localePath } from "@/lib/i18n";

const HERO_LAYOUT = [
  "lg:col-start-1 lg:col-span-9 lg:row-start-1 lg:row-span-8",
  "lg:z-10 lg:col-start-5 lg:col-span-8 lg:row-start-6 lg:row-span-7 lg:shadow-lg",
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
const ZEFFY_DONATION_EMBED_URL: string | null = ZEFFY_DONATION_URL;

// TODO(launch): the recipient name + email/phone shown in the center's banking app.
const ZELLE_RECIPIENT: string | null = null;

export default async function PaymentsPage() {
  const dict = await getDictionary();

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
          <HeroPhotos
            layout={HERO_LAYOUT}
            tileClassName="aspect-photo w-full rounded-xl border-4 border-white shadow-sm lg:aspect-auto"
            placeholderLabel={dict.payments.photoLabel}
            className="grid w-full shrink-0 grid-cols-2 gap-4 lg:h-96 lg:w-104 lg:grid-cols-12 lg:grid-rows-12 lg:gap-0 xl:h-112 xl:w-116"
          />
        }
      />

      <PageSection
        id="donate"
        surface="white"
        watermark="寄"
        watermarkClassName="top-40 -right-16 text-magenta/5"
        accent={dict.payments.donateAccent}
        caption={dict.payments.donateCaption}
        title={dict.payments.donateTitle}
        lede={dict.payments.donateText}
      >
        <div className="surface-card reveal-rise max-w-3xl overflow-clip">
          {ZEFFY_DONATION_EMBED_URL ? (
            <iframe
              title={dict.payments.donateFrame}
              src={ZEFFY_DONATION_EMBED_URL}
              className="h-[720px] w-full"
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
      </PageSection>

      <PageSection
        id="dues"
        surface="mist"
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
    </>
  );
}
