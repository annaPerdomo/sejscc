"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { buttonVariantClass } from "@/components/admin/admin-button";
import { AdminUserIdentity } from "@/components/admin/admin-user-identity";
import { byAdminPageOrder, PAGE_TONES } from "@/components/admin/admin-page-tone";
import type { UserRole } from "@/db/schema";
import type { EditablePageId } from "@/lib/editable-pages";
import { signOutAction } from "./sign-out-action";

type NavItem = {
  href: string;
  label: string;
  surface?: string;
  adminOnly?: boolean;
  alsoActiveFor?: string[];
};
type NavGroup = { heading: string | null; items: NavItem[] };

const PAGE_NAV_ITEMS: Record<EditablePageId, Omit<NavItem, "surface"> & { id: EditablePageId }> = {
  events: {
    id: "events",
    href: "/admin/events",
    label: "Events",
    alsoActiveFor: ["/admin/pages/events"],
  },
  groups: {
    id: "groups",
    href: "/admin/groups",
    label: "Sports & Classes",
    alsoActiveFor: ["/admin/pages/groups"],
  },
  home: {
    id: "home",
    href: "/admin/pages/home",
    label: "Home",
    alsoActiveFor: ["/admin/board"],
  },
  donate: {
    id: "donate",
    href: "/admin/pages/donate",
    label: "Donations",
    alsoActiveFor: ["/admin/donations"],
  },
  school: {
    id: "school",
    href: "/admin/pages/school",
    label: "Japanese School",
    alsoActiveFor: ["/admin/levels", "/admin/school-year"],
  },
};

const NAV_GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [{ href: "/admin", label: "Start here" }],
  },
  {
    heading: "Pages of the website",
    items: Object.values(PAGE_NAV_ITEMS)
      .sort(byAdminPageOrder)
      .map(({ id, ...item }) => ({ ...item, surface: PAGE_TONES[id].surface })),
  },
  {
    heading: "Top & bottom of every page",
    items: [
      { href: "/admin/announcement", label: "Top banner" },
      { href: "/admin/contact", label: "Contact info" },
    ],
  },
  {
    heading: "Admin only",
    items: [
      { href: "/admin/volunteers", label: "Who Can Sign In", adminOnly: true },
      { href: "/admin/settings", label: "Settings", adminOnly: true },
    ],
  },
];

const footerButton = `block rounded-lg px-3 py-2 text-sm ${buttonVariantClass("on-dark")}`;

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
      <span
        aria-hidden="true"
        className="absolute inset-y-0 right-0 hidden w-1 bg-gradient-to-b from-indigo via-sky to-magenta lg:block"
      />

      <div className="relative flex items-center justify-between gap-3 px-5 py-4 lg:px-6 lg:pt-6 lg:pb-2">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo-mark-white.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0"
          />
          <span className="min-w-0 font-display text-sm leading-snug font-semibold text-white">
            Southeast Japanese School &amp; Community Center
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
        className={`relative px-5 pb-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-6 ${
          open ? "block" : "hidden lg:flex"
        }`}
      >
        <nav aria-label="Admin sections" className="flex flex-col pt-2">
          {NAV_GROUPS.map((group, index) => {
            const items = group.items.filter((item) => !item.adminOnly || user.role === "admin");
            if (items.length === 0) return null;
            const headingId = `${navGroupBaseId}-${index}`;
            return (
              <div key={group.heading ?? "root"}>
                {group.heading && (
                  <p
                    id={headingId}
                    className="mt-3 mb-1 px-3 font-display text-sm font-semibold text-sky"
                  >
                    {group.heading}
                  </p>
                )}
                <ul aria-labelledby={group.heading ? headingId : undefined} className="flex flex-col">
                  {items.map((item) => {
                    const active = isActive(pathname, item);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-10 items-center gap-3 rounded-md border-l-4 px-3 py-1.5 font-display text-base font-semibold tracking-wide ${
                            active
                              ? "border-sky bg-white/10 text-white"
                              : "border-transparent text-white/85 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {item.surface && (
                            <span
                              aria-hidden="true"
                              className={`h-4 w-4 shrink-0 rounded-sm ${item.surface}`}
                            />
                          )}
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="mt-5 border-t border-white/15 pt-4 lg:mt-auto">
          <Link
            href="/admin/profile"
            onClick={() => setOpen(false)}
            className="block rounded-md p-1.5 hover:bg-white/10"
          >
            <AdminUserIdentity user={user} caption="Your profile" />
          </Link>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/" className={`${footerButton} text-center`}>
              View website
            </Link>
            <form action={signOutAction}>
              <button type="submit" className={`${footerButton} w-full`}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
