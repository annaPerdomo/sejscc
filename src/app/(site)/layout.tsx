import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";

const NAV = [
  { href: "/events", label: "Events" },
  { href: "/groups", label: "Groups & Programs" },
  { href: "/payments", label: "Payments" },
];

function SakuraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="11"
          rx="5.5"
          ry="8"
          fill="currentColor"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3.5" fill="#faf6ef" />
    </svg>
  );
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-sand bg-cream/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <SakuraMark className="h-8 w-8 shrink-0 text-vermilion sm:h-9 sm:w-9" />
            <span className="min-w-0 leading-tight">
              <span className="block text-[10px] font-medium tracking-[0.18em] text-stone uppercase sm:text-[11px]">
                Southeast Japanese
              </span>
              <span className="block truncate font-serif text-base text-ink sm:text-lg">
                School &amp; Community Center
              </span>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-cream-deep hover:text-ink sm:block"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/payments#donate"
              className="rounded-md bg-vermilion px-3.5 py-2 text-sm font-semibold text-white hover:bg-vermilion-deep sm:px-4"
            >
              Donate
            </Link>
            <MobileNav items={NAV} />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-sand bg-ink text-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-serif text-lg text-white">
              Southeast Japanese School &amp; Community Center
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              14615 S. Gridley Rd.
              <br />
              Norwalk, CA 90650
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Contact</p>
            <p className="mt-3">
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
            <p className="font-semibold text-white">Visit</p>
            <ul className="mt-3 space-y-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="hover:text-white">
                  Board sign-in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Southeast Japanese School &amp; Community
          Center. A nonprofit community organization.
        </div>
      </footer>
    </div>
  );
}
