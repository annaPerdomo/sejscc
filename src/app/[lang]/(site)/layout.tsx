import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
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
        <div className="h-[3px] bg-gradient-to-r from-indigo via-sky to-magenta" />
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
          <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
            <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hidden rounded-md px-3 py-2 font-display text-[13px] font-semibold tracking-[0.08em] text-ink-soft uppercase hover:text-indigo sm:block"
                >
                  {item.label}
                </Link>
              ))}
              <LanguageToggle
                current={lang}
                label={dict.languageToggle.label}
                className="hidden sm:flex"
              />
              <Link
                href={href("/payments") + "#donate"}
                className="rounded-md bg-magenta px-3.5 py-2 font-display text-sm font-semibold text-white hover:bg-magenta-deep sm:px-4"
              >
                {dict.header.donate}
              </Link>
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
            </nav>
          </div>
        </header>
      </div>

      <main className="flex-1">{children}</main>

      <section id="connect" className="grid scroll-mt-16 bg-mist md:grid-cols-2">
        <PhotoPlaceholder
          label={dict.home.connectPhotoLabel}
          frame={false}
          className="min-h-64 w-full"
        />
        <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-14">
          <div className="flex items-center gap-3">
            <span className="font-display text-xs font-semibold tracking-[0.2em] text-indigo uppercase">
              {dict.home.connectKickerCaption}
            </span>
            <span className="h-0.5 w-9 bg-magenta" />
            <span className="font-accent text-sm font-bold tracking-[0.2em] text-indigo">
              {dict.home.connectKickerAccent}
            </span>
          </div>
          <h2 className="mt-4 font-display text-2xl leading-snug font-normal tracking-[0.02em] text-ink sm:text-3xl">
            {dict.home.connectTitle}
          </h2>
          <p className="mt-4 max-w-lg leading-relaxed text-ink-soft">
            {dict.home.connectText}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="tel:+15628635996"
              className="rounded-lg bg-indigo px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-indigo-deep"
            >
              {dict.home.connectCall}
            </a>
            <a
              href="mailto:info@sejscc.org"
              className="rounded-lg border-2 border-ink/20 px-5 py-2.5 font-display text-sm font-semibold text-ink hover:border-ink"
            >
              {dict.home.connectEmail}
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6">
          <div>
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
                  {dict.footer.boardSignIn}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <span className="text-xs text-white/60">
              © {new Date().getFullYear()} {dict.footer.legal}
            </span>
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
