import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import { LanguageToggle } from "@/components/language-toggle";
import { MadeWithLove } from "@/components/made-with-love";
import { MobileNav } from "@/components/mobile-nav";
import { ZEFFY_DONATION_URL } from "@/lib/donate";
import { getUpcomingEvents } from "@/lib/events";
import { formatEventDate } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, dict, [nextEvent]] = await Promise.all([
    getLocale(),
    getDictionary(),
    getUpcomingEvents(1),
  ]);
  const href = (path: string) => localePath(lang, path);

  const nav = [
    { href: href("/events"), label: dict.nav.events },
    { href: href("/groups"), label: dict.nav.groups },
    { href: href("/payments"), label: dict.nav.payments },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40">
        <div className="h-1 bg-gradient-to-r from-indigo via-sky via-60% to-magenta" />
        {nextEvent && (
          <div className="flex items-center justify-center gap-3 bg-navy px-4 py-2">
            <span className="shrink-0 font-accent text-sm font-bold tracking-[0.1em] text-sky">
              {dict.header.announcementAccent}
            </span>
            <span className="hidden shrink-0 font-display text-[11px] font-bold tracking-[0.2em] text-white uppercase sm:inline">
              {dict.header.announcementLabel}
            </span>
            <span className="min-w-0 truncate text-xs text-white/85">
              {nextEvent.title}
              {formatEventDate(nextEvent.startAt, lang) &&
                ` · ${formatEventDate(nextEvent.startAt, lang)}`}
            </span>
            <Link
              href={href(`/events/${nextEvent.slug}`)}
              className="shrink-0 font-display text-xs font-bold text-blossom underline-offset-4 hover:text-white hover:underline"
            >
              {dict.header.announcementCta} →
            </Link>
          </div>
        )}
        <header className="border-b border-line bg-paper/95 backdrop-blur">
          <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
            <Link href={href("/")} className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <Image
                src="/logo-mark.png"
                alt=""
                width={44}
                height={44}
                className="h-9 w-9 shrink-0 sm:h-11 sm:w-11"
              />
              <span className="min-w-0 leading-tight">
                <span className="block text-[10px] font-semibold tracking-[0.18em] text-indigo uppercase sm:text-[11px]">
                  {dict.header.orgTop}
                </span>
                <span className="block truncate font-display text-base text-ink sm:text-lg">
                  {dict.header.orgBottom}
                </span>
              </span>
            </Link>
            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 font-display text-[13px] font-semibold tracking-[0.08em] text-ink-soft uppercase hover:text-indigo"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:ml-0">
              <LanguageToggle
                current={lang}
                label={dict.languageToggle.label}
                className="hidden lg:flex"
              />
              <ExternalLink
                href={ZEFFY_DONATION_URL}
                className="button-donate rounded-md px-3.5 py-2 font-display text-sm font-semibold text-white sm:px-4"
              >
                {dict.header.donate}
              </ExternalLink>
              <MobileNav
                items={nav}
                openLabel={dict.header.openMenu}
                closeLabel={dict.header.closeMenu}
              >
                <LanguageToggle
                  current={lang}
                  label={dict.languageToggle.label}
                  className="w-fit"
                />
              </MobileNav>
            </div>
          </div>
        </header>
      </div>

      <main className="flex-1">{children}</main>

      <footer className="seigaiha-rings seigaiha-rings-sky bg-navy text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-10 sm:grid-cols-3 sm:gap-10 sm:px-6 sm:py-14">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3">
              <Image src="/logo-mark-white.png" alt="" width={40} height={40} />
              <p className="font-display text-lg leading-snug font-normal">
                {dict.footer.orgName}
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              14615 S. Gridley Rd.
              <br />
              Norwalk, CA 90650
            </p>
          </div>
          <div className="text-sm">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-sky uppercase">
              {dict.footer.contact}
            </p>
            <p className="mt-4 text-white/80">
              <a href="tel:+15628635996" className="hover:text-white">
                (562) 863-5996
              </a>
              <br />
              <a href="mailto:info@sejscc.org" className="hover:text-white">
                info@sejscc.org
              </a>
            </p>
          </div>
          <div className="text-sm">
            <p className="font-display text-xs font-semibold tracking-[0.14em] text-sky uppercase">
              {dict.footer.visit}
            </p>
            <ul className="mt-4 space-y-2 text-white/80">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="hover:text-white">
                  {dict.footer.volunteerSignIn}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center lg:flex-row lg:items-baseline lg:justify-between lg:gap-6 lg:text-left">
            <span className="text-xs text-white/60">
              © {new Date().getFullYear()} {dict.footer.legal}
            </span>
            <MadeWithLove
              madeWith={dict.footer.madeWith}
              by={dict.footer.madeBy}
              className="text-xs text-white/60"
              heartClassName="text-blossom"
            />
            <span className="text-xs text-white/60">
              <span className="font-accent font-bold text-white">
                {dict.footer.farewellAccent}
              </span>{" "}
              {dict.footer.farewellCaption}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
