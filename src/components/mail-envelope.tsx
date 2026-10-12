import type { ReactNode } from "react";
import { HeartIcon } from "@/components/donate-icons";

const BARCODE = "1011001010110100101101001011001101";

export function MailEnvelope({ children }: { children: ReactNode }) {
  return (
    <div className="envelope flex flex-col px-6 pt-32 pb-5 sm:aspect-photo sm:px-10 sm:pt-6">
      <div aria-hidden="true" className="absolute top-4 right-4 drop-shadow-md sm:top-5 sm:right-5">
        <svg
          viewBox="0 0 120 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute top-2.5 -left-26 z-10 w-36 text-ink/35"
        >
          <path d="M2 22c8-5 14 5 22 0s14 5 22 0s10 3 14 1M2 32c8-5 14 5 22 0s14 5 22 0s10 3 14 1M2 42c8-5 14 5 22 0s14 5 22 0s10 3 14 1" />
          <circle cx="88" cy="32" r="26" />
          <circle cx="88" cy="32" r="20" strokeDasharray="2 4" />
        </svg>
        <div className="postage-stamp">
          <div className="flex h-20 w-16 items-center justify-center bg-magenta text-cream">
            <HeartIcon className="size-8" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center pb-8 sm:pt-12 sm:pb-0">
        <address className="font-display text-2xl leading-relaxed text-ink not-italic sm:text-3xl sm:leading-relaxed">
          {children}
        </address>
      </div>

      <div aria-hidden="true" className="flex h-3 items-end justify-end gap-0.5">
        {[...BARCODE].map((bar, i) => (
          <span key={i} className={`w-0.5 bg-ink/25 ${bar === "1" ? "h-3" : "h-1.5"}`} />
        ))}
      </div>
    </div>
  );
}
