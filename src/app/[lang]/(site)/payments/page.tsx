import type { Metadata } from "next";
import { getDictionary, getDictionaryFor } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";

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

// TODO(launch): Zeffy dashboard → form → Share → Embed, once the account clears.
const ZEFFY_DONATION_EMBED_URL: string | null = null;

// TODO(launch): the recipient name + email/phone shown in the center's banking app.
const ZELLE_RECIPIENT: string | null = null;

export default async function PaymentsPage() {
  const dict = await getDictionary();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-ink sm:text-5xl">
        {dict.payments.title}
      </h1>
      <div className="mt-4 h-1 w-12 rounded-full bg-vermilion" />
      <p className="mt-5 max-w-2xl text-stone">{dict.payments.lede}</p>

      <section id="donate" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-2xl text-ink">
          {dict.payments.donateTitle}
        </h2>
        <p className="mt-2 text-stone">{dict.payments.donateText}</p>
        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-white">
          {ZEFFY_DONATION_EMBED_URL ? (
            <iframe
              title={dict.payments.donateFrame}
              src={ZEFFY_DONATION_EMBED_URL}
              className="h-[720px] w-full"
              allow="payment"
            />
          ) : (
            <div className="p-8 text-stone">
              <p className="font-semibold text-ink">
                {dict.payments.donateSoon}
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                {dict.payments.donateSoonBefore}
                <a
                  href="mailto:info@sejscc.org"
                  className="font-semibold text-vermilion"
                >
                  info@sejscc.org
                </a>
                {dict.payments.donateSoonAfter}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="dues" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-2xl text-ink">
          {dict.payments.duesTitle}
        </h2>
        <p className="mt-2 max-w-2xl text-stone">{dict.payments.duesText}</p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-6">
            <h3 className="font-serif text-xl text-ink">
              {dict.payments.zelleTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone">
              {dict.payments.zelleText}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              {ZELLE_RECIPIENT ?? (
                <>
                  {dict.payments.zelleBefore}
                  <a
                    href="mailto:gakuen@sejscc.org"
                    className="font-semibold text-vermilion"
                  >
                    gakuen@sejscc.org
                  </a>
                  {dict.payments.zelleAfter}
                </>
              )}
            </p>
            <p className="mt-3 text-sm text-stone">{dict.payments.zelleMemo}</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-6">
            <h3 className="font-serif text-xl text-ink">
              {dict.payments.checkTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone">
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
            <p className="mt-3 text-sm text-stone">{dict.payments.checkMemo}</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-stone">
          {dict.payments.questionsBefore}
          <a
            href="mailto:gakuen@sejscc.org"
            className="font-semibold text-vermilion"
          >
            gakuen@sejscc.org
          </a>
          {dict.payments.questionsAfter}
        </p>
      </section>
    </div>
  );
}
