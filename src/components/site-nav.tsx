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
    <nav className="hidden items-center gap-5 lg:flex xl:gap-6">
      {items.map((item) => {
        const current = isCurrentPage(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`relative rounded-sm px-1 py-2 font-display text-sm transition-colors after:absolute after:inset-x-1 after:bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:transition-transform after:duration-300 after:ease-out ${
              current
                ? "font-semibold text-indigo after:bg-indigo"
                : "font-medium text-ink after:scale-x-0 after:bg-sky hover:text-indigo hover:after:scale-x-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
