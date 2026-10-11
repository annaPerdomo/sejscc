"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { AdminUserIdentity } from "@/components/admin/admin-user-identity";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { SectionKicker } from "@/components/section-kicker";
import { byAdminPageOrder, PAGE_TONES } from "@/components/admin/admin-page-tone";
import type { UserRole } from "@/db/schema";
import type { EditablePageId } from "@/lib/editable-pages";
import { signOutAction } from "./sign-out-action";

type NavItem = {
  href: string;
  label: string;
  hint?: string;
  kanji: string;
  surface?: string;
  adminOnly?: boolean;
  alsoActiveFor?: string[];
};
type NavGroup = { heading: string | null; items: NavItem[] };

const PAGE_NAV_ITEMS: Record<
  EditablePageId,
  Omit<NavItem, "kanji" | "surface"> & { id: EditablePageId }
> = {
  events: {
    id: "events",
    href: "/admin/events",
    label: "Events page",
    hint: "Add or change an event",
    alsoActiveFor: ["/admin/pages/events"],
  },
  groups: {
    id: "groups",
    href: "/admin/groups",
    label: "Sports & Classes page",
    hint: "Add or change a group",
    alsoActiveFor: ["/admin/pages/groups"],
  },
  home: {
    id: "home",
    href: "/admin/pages/home",
    label: "Home page",
    hint: "Board, history, community",
    alsoActiveFor: ["/admin/board"],
  },
  donate: {
    id: "donate",
    href: "/admin/pages/donate",
    label: "Donations page",
    hint: "Ways to give",
    alsoActiveFor: ["/admin/donations"],
  },
  school: {
    id: "school",
    href: "/admin/pages/school",
    label: "Japanese School page",
    hint: "Classes, school year, tuition",
    alsoActiveFor: ["/admin/levels", "/admin/school-year"],
  },
};

const NAV_GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [{ href: "/admin", label: "Start here", kanji: "始" }],
  },
  {
    heading: "Pages of the website",
    items: Object.values(PAGE_NAV_ITEMS)
      .sort(byAdminPageOrder)
      .map(({ id, ...item }) => ({
        ...item,
        kanji: PAGE_TONES[id].kanji,
        surface: PAGE_TONES[id].surface,
      })),
  },
  {
    heading: "Top & bottom of every page",
    items: [
      {
        href: "/admin/announcement",
        label: "Top banner",
        hint: "Message above the menu",
        kanji: "報",
      },
      {
        href: "/admin/contact",
        label: "Phone, email & address",
        hint: "Shown at the bottom",
        kanji: "連",
      },
    ],
  },
  {
    heading: "Admin only",
    items: [
      {
        href: "/admin/volunteers",
        label: "Who Can Sign In",
        kanji: "友",
        adminOnly: true,
      },
      { href: "/admin/settings", label: "Settings", kanji: "設", adminOnly: true },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/admin") return pathname === "/admin";
  return [item.href, ...(item.alsoActiveFor ?? [])].some((href) => pathname.startsWith(href));
}

export function AdminSidebar({
  user,
}: {
  user: { name: string | null; email: string | null; role: UserRole };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navGroupBaseId = useId();

  return (
    <header className="section-navy-scene relative isolate overflow-clip text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col lg:self-start">
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
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 font-display text-base font-semibold text-white hover:bg-white/10 lg:hidden"
        >
          {open ? "Close" : "Menu"}
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
        className={`relative px-5 pb-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-8 lg:pb-9 ${
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
          <nav aria-label="Admin sections" className="flex flex-col">
            {NAV_GROUPS.map((group, index) => {
              const items = group.items.filter(
                (item) => !item.adminOnly || user.role === "admin"
              );
              if (items.length === 0) return null;
              const headingId = `${navGroupBaseId}-${index}`;
              return (
                <div key={group.heading ?? "root"}>
                  {group.heading && (
                    <p
                      id={headingId}
                      className="mt-6 mb-1 px-3 font-display text-sm font-semibold tracking-widest text-sky uppercase"
                    >
                      {group.heading}
                    </p>
                  )}
                  <ul
                    aria-labelledby={group.heading ? headingId : undefined}
                    className="flex flex-col gap-1"
                  >
                    {items.map((item) => {
                      const active = isActive(pathname, item);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-3 font-display tracking-wide ${
                              active
                                ? "border-sky bg-white/10 text-white"
                                : "border-transparent text-white/80 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-accent text-lg font-bold ${
                                item.surface ? `${item.surface} text-ink` : "bg-white/10 text-white"
                              }`}
                            >
                              {item.kanji}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-base font-semibold">{item.label}</span>
                              {item.hint && (
                                <span
                                  className={`block text-sm font-normal ${active ? "text-white/90" : "text-white/70"}`}
                                >
                                  {item.hint}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 border-t border-white/15 pt-5 lg:mt-auto">
          <AdminUserIdentity user={user} />
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold tracking-wide">
            <Link href="/" className="inline-flex min-h-11 items-center text-white/80 hover:text-white">
              View website
            </Link>
            <Link
              href="/admin/profile"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center text-white/80 hover:text-white"
            >
              Your profile
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="inline-flex min-h-11 items-center text-white/80 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
