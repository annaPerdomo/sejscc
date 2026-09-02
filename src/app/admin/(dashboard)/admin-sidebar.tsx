"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminUserIdentity } from "@/components/admin/admin-user-identity";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { SectionKicker } from "@/components/section-kicker";
import type { UserRole } from "@/db/schema";
import { signOutAction } from "./sign-out-action";

const NAV: {
  href: string;
  label: string;
  kanji: string;
  adminOnly?: boolean;
}[] = [
  { href: "/admin", label: "Dashboard", kanji: "家" },
  { href: "/admin/events", label: "Events", kanji: "祭" },
  { href: "/admin/groups", label: "Groups", kanji: "部" },
  { href: "/admin/volunteers", label: "Volunteers", kanji: "友", adminOnly: true },
  { href: "/admin/settings", label: "Settings", kanji: "設", adminOnly: true },
];

function isActiveHref(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebar({
  user,
}: {
  user: { name: string | null; email: string | null; role: UserRole };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="section-navy-scene relative isolate overflow-clip text-white lg:flex lg:w-72 lg:shrink-0 lg:flex-col">
      <KanjiWatermark char="絆" className="-bottom-16 -left-14 text-white/5" />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 right-0 hidden w-1 bg-gradient-to-b from-indigo via-sky to-magenta lg:block"
      />

      <div className="relative flex items-center justify-between gap-3 px-5 py-4 lg:flex-col lg:items-stretch lg:gap-0 lg:px-8 lg:pt-10 lg:pb-0">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo-mark-white.png"
            alt=""
            width={44}
            height={44}
            className="h-10 w-10 shrink-0 lg:h-11 lg:w-11"
          />
          <span className="min-w-0 font-display text-sm font-semibold tracking-wider text-white uppercase">
            Southeast Japanese School
            <br />
            &amp; Community Center
          </span>
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-sidebar-panel"
          aria-label={open ? "Close admin menu" : "Open admin menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 lg:hidden"
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
      </div>

      <div
        id="admin-sidebar-panel"
        className={`relative px-5 pb-5 lg:flex lg:flex-1 lg:flex-col lg:px-8 lg:pb-9 ${
          open ? "block" : "hidden lg:flex"
        }`}
      >
        <div className="pt-2 lg:pt-9">
          <SectionKicker
            accent="ボランティア"
            caption="Volunteer Portal"
            tone="sky"
            className="mb-4"
          />
          <nav aria-label="Admin sections" className="flex flex-col gap-1">
            {NAV.filter(
              (item) => !item.adminOnly || user.role === "admin"
            ).map((item) => {
              const active = isActiveHref(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-3 font-display text-sm font-semibold tracking-wide ${
                    active
                      ? "border-sky text-white"
                      : "border-transparent text-white/70 hover:text-white"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`font-accent text-sm font-bold ${
                      active ? "text-sky" : "text-sky/60"
                    }`}
                  >
                    {item.kanji}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 border-t border-white/15 pt-5 lg:mt-auto">
          <AdminUserIdentity user={user} />
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold tracking-wide">
            <Link href="/" className="text-white/70 hover:text-white">
              View website
            </Link>
            <Link
              href="/admin/profile"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white"
            >
              Edit profile
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="text-white/70 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
