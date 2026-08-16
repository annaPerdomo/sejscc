import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const href = (path: string) => localePath(lang, path);

  const nav = [
    { href: href("/events"), label: dict.nav.events },
    { href: href("/groups"), label: dict.nav.groups },
    { href: href("/payments"), label: dict.nav.payments },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
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
              <span className="block text-[10px] font-semibold tracking-[0.18em] text-vermilion uppercase sm:text-[11px]">
                {dict.header.orgTop}
              </span>
              <span className="block truncate font-serif text-base text-ink sm:text-lg">
                {dict.header.orgBottom}
              </span>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hidden rounded-md px-3 py-2 text-[13px] font-semibold tracking-[0.08em] text-ink-soft uppercase hover:text-vermilion sm:block"
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
              className="rounded-md bg-vermilion px-3.5 py-2 text-sm font-semibold text-white hover:bg-vermilion-deep sm:px-4"
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

      <main className="flex-1">{children}</main>

      <section className="bg-vermilion">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-serif text-2xl text-white">
              {dict.home.connectTitle}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90">
              {dict.home.connectText}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-3">
            <a
              href="tel:+15628635996"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-vermilion hover:bg-white/90"
            >
              {dict.home.connectCall}
            </a>
            <a
              href="mailto:info@sejscc.org"
              className="rounded-md border border-white/60 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {dict.home.connectEmail}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-mist text-stone">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logo-mark.png" alt="" width={36} height={36} />
              <p className="font-serif text-lg leading-snug text-ink">
                {dict.footer.orgName}
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              14615 S. Gridley Rd.
              <br />
              Norwalk, CA 90650
            </p>
          </div>
          <div className="text-sm">
            <p className="text-xs font-semibold tracking-[0.14em] text-ink uppercase">
              {dict.footer.contact}
            </p>
            <p className="mt-4">
              <a href="tel:+15628635996" className="hover:text-vermilion">
                (562) 863-5996
              </a>
              <br />
              <a href="mailto:info@sejscc.org" className="hover:text-vermilion">
                info@sejscc.org
              </a>
            </p>
          </div>
          <div className="text-sm">
            <p className="text-xs font-semibold tracking-[0.14em] text-ink uppercase">
              {dict.footer.visit}
            </p>
            <ul className="mt-4 space-y-2">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-vermilion">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="hover:text-vermilion">
                  {dict.footer.boardSignIn}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line px-4 py-4 text-center text-xs text-stone">
          © {new Date().getFullYear()} {dict.footer.legal}
        </div>
      </footer>
    </div>
  );
}
