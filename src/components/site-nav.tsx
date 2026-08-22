"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { stripLocale } from "@/lib/i18n";

export type NavItem = { href: string; label: string };

export function useIsCurrentPage() {
  const pathname = stripLocale(usePathname());

  return (href: string) => {
    const path = stripLocale(href);
    return pathname === path || pathname.startsWith(`${path}/`);
  };
}

export function SiteNav({ items }: { items: NavItem[] }) {
  const isCurrentPage = useIsCurrentPage();

  return (
    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-3">
      {items.map((item) => {
        const current = isCurrentPage(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`relative rounded-md px-3 py-2 font-display text-[13px] font-semibold tracking-[0.08em] uppercase after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:rounded-full ${
              current
                ? "text-indigo after:bg-indigo"
                : "text-ink-soft hover:text-indigo hover:after:bg-line"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
