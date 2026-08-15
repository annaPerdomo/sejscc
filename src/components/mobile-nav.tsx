"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileNav({
  items,
  openLabel,
  closeLabel,
  children,
}: {
  items: { href: string; label: string }[];
  openLabel: string;
  closeLabel: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-cream-deep"
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
        <nav className="absolute inset-x-0 top-full border-b border-sand bg-cream shadow-lg">
          <ul className="px-4 py-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 font-medium text-ink hover:bg-cream-deep"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {children && (
            <div className="border-t border-sand px-7 py-4">{children}</div>
          )}
        </nav>
      )}
    </div>
  );
}
