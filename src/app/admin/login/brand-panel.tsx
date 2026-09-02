import Image from "next/image";
import Link from "next/link";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { MadeWithLove } from "@/components/made-with-love";
import { SectionKicker } from "@/components/section-kicker";

export function LoginBrandPanel() {
  return (
    <div className="section-navy-scene relative isolate flex shrink-0 flex-col justify-between gap-10 overflow-clip px-6 pt-10 pb-2 text-white sm:px-10 sm:pt-12 lg:w-2/5 lg:max-w-lg lg:gap-16 lg:px-12 lg:pt-14">
      <KanjiWatermark char="絆" className="-right-16 -bottom-20 text-white/5" />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 right-0 hidden w-1 bg-gradient-to-b from-indigo via-sky to-magenta lg:block"
      />

      <Link href="/" className="relative flex items-center gap-3">
        <Image
          src="/logo-mark-white.png"
          alt=""
          width={48}
          height={48}
          className="h-11 w-11 shrink-0 sm:h-12 sm:w-12"
        />
        <span className="font-display text-sm font-semibold tracking-wider text-white uppercase">
          Southeast Japanese School
          <br />
          &amp; Community Center
        </span>
      </Link>

      <div className="relative">
        <SectionKicker
          accent="ボランティア"
          caption="Volunteer Portal"
          tone="sky"
          className="mb-4"
        />
        <p className="font-display text-3xl leading-snug font-normal tracking-wide sm:text-4xl">
          <span className="text-white">Thank you for</span>
          <br />
          <span className="text-sky">showing up.</span>
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-sky">
          Behind every class, festival, event, and announcement are people who
          give their time to make it happen. Thank you for helping tell our
          community’s story and keeping everyone connected.
        </p>
      </div>

      <div className="relative border-t border-white/20 pt-5">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-sky">Est. 1925 · Norwalk, California</span>
          <span className="text-sky">
            <span className="font-accent font-bold text-white">
              おかえりなさい
            </span>{" "}
            — welcome back
          </span>
        </div>
        <MadeWithLove
          madeWith="Made with"
          by="by"
          className="mt-3 block text-center text-xs text-sky"
        />
      </div>
    </div>
  );
}
