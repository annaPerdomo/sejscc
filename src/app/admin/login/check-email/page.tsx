import Link from "next/link";
import { SectionKicker } from "@/components/section-kicker";
import { LoginBrandPanel } from "../brand-panel";

export default function CheckEmailPage() {
  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <LoginBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 text-center sm:px-10 lg:px-16">
        <div className="w-full max-w-sm">
          <div
            aria-hidden="true"
            className="mx-auto flex size-24 items-center justify-center rounded-full border-2 border-dashed border-gold"
          >
            <span className="font-display text-3xl text-indigo">✉</span>
          </div>

          <SectionKicker
            accent="送信済み"
            caption="Link Sent"
            className="mt-6 justify-center"
          />
          <h1 className="mt-4 font-display text-2xl font-normal tracking-wide text-ink sm:text-3xl">
            Check Your <span className="text-indigo">Email</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            We sent you a sign-in link. Open it on this device to continue —
            it works once and expires after 24 hours.
          </p>

          <div className="mt-6 rounded-lg border border-line bg-mist px-5 py-4 text-left text-sm leading-relaxed text-ink-soft">
            Don&apos;t see it? Check your spam folder, or make sure you used
            the email you volunteer with.
          </div>

          <Link
            href="/admin/login"
            className="mt-6 inline-block font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
          >
            Use a different email
          </Link>
        </div>
      </div>
    </main>
  );
}
