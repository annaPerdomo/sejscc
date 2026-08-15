import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments & Donations",
  description:
    "Donate to the Southeast Japanese School & Community Center or pay dues and tuition.",
};

// TODO(provisioning): once the center's Zeffy account is approved, paste the
// embed URL of its donation form here (Zeffy dashboard → form → Share → Embed).
const ZEFFY_DONATION_EMBED_URL: string | null = null;

// TODO(provisioning): confirm the center's Zelle recipient (name + email or
// phone shown in the banking app) before launch.
const ZELLE_RECIPIENT: string | null = null;

export default function PaymentsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-ink">Payments &amp; Donations</h1>
      <p className="mt-3 max-w-2xl text-stone">
        Every payment method below sends 100% (or as close to it as possible)
        of your money to the center — we&apos;ve chosen options with no
        processing fees wherever we can.
      </p>

      {/* Donations */}
      <section id="donate" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-2xl text-ink">Donate</h2>
        <p className="mt-2 text-stone">
          Donations fund building upkeep, programs, and scholarships.
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border border-sand bg-white">
          {ZEFFY_DONATION_EMBED_URL ? (
            <iframe
              title="Donate to SEJSCC"
              src={ZEFFY_DONATION_EMBED_URL}
              className="h-[720px] w-full"
              allow="payment"
            />
          ) : (
            <div className="p-8 text-stone">
              <p className="font-semibold text-ink">
                Online donations are coming soon.
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                Until then, donations are gratefully accepted by Zelle or by
                check (see below), or contact the center at{" "}
                <a
                  href="mailto:info@sejscc.org"
                  className="font-semibold text-vermilion"
                >
                  info@sejscc.org
                </a>
                .
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Dues & tuition */}
      <section id="dues" className="mt-12 scroll-mt-24">
        <h2 className="font-serif text-2xl text-ink">
          Dues, Tuition &amp; Fees
        </h2>
        <p className="mt-2 max-w-2xl text-stone">
          Participant dues, Japanese school tuition, registration, and
          textbooks can be paid two ways — both fee-free, so the center
          receives your full payment.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-sand bg-white p-6">
            <h3 className="font-serif text-xl text-ink">Zelle</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone">
              Send payments through your bank&apos;s app with Zelle —
              instant and no fees.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              {ZELLE_RECIPIENT ?? (
                <>
                  Contact{" "}
                  <a
                    href="mailto:gakuen@sejscc.org"
                    className="font-semibold text-vermilion"
                  >
                    gakuen@sejscc.org
                  </a>{" "}
                  for the center&apos;s Zelle details.
                </>
              )}
            </p>
            <p className="mt-3 text-sm text-stone">
              Please include the student or member name and what the payment is
              for in the memo.
            </p>
          </div>
          <div className="rounded-xl border border-sand bg-white p-6">
            <h3 className="font-serif text-xl text-ink">Check by Mail</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone">
              Make checks payable to <strong>SEJSCC</strong> and mail to:
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              SEJSCC
              <br />
              14615 S. Gridley Rd.
              <br />
              Norwalk, CA 90650
            </p>
            <p className="mt-3 text-sm text-stone">
              Include a note with the student or member name and what the
              payment covers.
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm text-stone">
          Questions about tuition amounts or what you owe? Email{" "}
          <a
            href="mailto:gakuen@sejscc.org"
            className="font-semibold text-vermilion"
          >
            gakuen@sejscc.org
          </a>
          .
        </p>
      </section>
    </div>
  );
}
