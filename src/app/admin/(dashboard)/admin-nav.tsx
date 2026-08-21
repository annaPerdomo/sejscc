"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/admin", label: "Events" },
  { href: "/admin/groups", label: "Groups" },
];

export function AdminNav() {
  const pathname = usePathname();
  const activeHref = pathname.startsWith("/admin/groups")
    ? "/admin/groups"
    : "/admin";

  return (
    <nav aria-label="Admin sections" className="mx-auto flex max-w-5xl px-6">
      {SECTIONS.map(({ href, label }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={
              active ? (pathname === href ? "page" : "true") : undefined
            }
            className={`border-b-2 px-3 py-2.5 text-sm font-medium ${
              active
                ? "border-indigo text-ink"
                : "border-transparent text-stone hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
