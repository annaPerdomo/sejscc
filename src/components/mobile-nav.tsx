"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsCurrentPage, type NavItem } from "@/components/site-nav";

export function MobileNav({
  items,
  openLabel,
  closeLabel,
  children,
}: {
  items: NavItem[];
  openLabel: string;
  closeLabel: string;
  children?: React.ReactNode;
}) {
  const isCurrentPage = useIsCurrentPage();
  const pathname = usePathname();

  // Keying on the pathname also closes the menu when the header's logo or
  // Donate link navigates — both sit outside it and have no onClick here.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const close = () => setOpenedOn(null);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
        onClick={() => setOpenedOn(open ? null : pathname)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-mist"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          {open ? (
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-full border-b border-line bg-paper shadow-lg">
          <ul className="px-4 py-2">
            {items.map((item) => {
              const current = isCurrentPage(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={current ? "page" : undefined}
                    className={`block rounded-md px-3 py-3 font-medium hover:bg-mist ${
                      current ? "bg-mist text-indigo" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {children && (
            <div className="border-t border-line px-7 py-4">{children}</div>
          )}
        </nav>
      )}
    </div>
  );
}
