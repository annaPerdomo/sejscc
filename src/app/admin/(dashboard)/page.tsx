import type { ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { EDITABLE_PAGES, type EditablePage } from "@/lib/editable-pages";
import { getAnnouncement, getCenterContact } from "@/lib/site-settings";
import { getSitePhotos } from "@/lib/site-photos";
import { buttonClass } from "@/components/admin/admin-button";
import { ADMIN_PAGES, type AdminPage } from "@/components/admin/admin-pages";
import { AdminPageWidth } from "@/components/admin/admin-page-width";

export const dynamic = "force-dynamic";

type PhotoSrc = ImageProps["src"];

const CENTER_TIME_ZONE = "America/Los_Angeles";

const QUICK_ACTIONS = [
  { href: "/admin/events/new", label: "Add a new event" },
  { href: "/admin/announcement", label: "Change the top banner" },
  { href: "/admin/groups/new", label: "Add a sport or class" },
];

function DashboardHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="font-display text-2xl text-ink sm:text-3xl">
      {children}
    </h2>
  );
}

function Tile({
  surface,
  photo,
  title,
  children,
  href,
  action,
  siteHref,
}: {
  surface: string;
  photo: PhotoSrc | null;
  title: string;
  children: ReactNode;
  href: string;
  action: string;
  siteHref?: string;
}) {
  return (
    <article className="surface-card surface-card-link relative flex flex-col overflow-clip">
      {photo && (
        <div className="relative aspect-band bg-mist">
          <Image src={photo} alt="" fill sizes="(min-width: 1280px) 30rem, 100vw" className="object-cover" />
        </div>
      )}
      <span aria-hidden="true" className={`block h-2 ${surface}`} />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="font-display text-2xl text-ink">{title}</h3>
        <div className="text-lg leading-relaxed text-ink-soft">{children}</div>
        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
          <Link href={href} className={`card-stretch text-lg ${buttonClass("primary")}`}>
            {action}
            <span className="sr-only"> — {title}</span>
          </Link>
          {siteHref && (
            <Link
              href={siteHref}
              className="relative z-10 inline-flex min-h-11 items-center text-base font-semibold text-indigo-deep underline underline-offset-4 hover:text-indigo"
            >
              See it on the website
              <span className="sr-only"> — {title}</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function AdminDashboard() {
  const session = await auth();
  const [announcement, sitePhotos, contact] = await Promise.all([
    getAnnouncement(),
    getSitePhotos(),
    getCenterContact(),
  ]);

  const pagesById = new Map(EDITABLE_PAGES.map((page) => [page.id, page]));

  function pagePhoto(page: EditablePage): PhotoSrc | null {
    const slot = page.sections.flatMap((section) => section.photos)[0];
    return slot ? (sitePhotos.get(slot.id)?.url ?? slot.defaultSrc) : null;
  }

  function pageTile(adminPage: AdminPage) {
    const page = pagesById.get(adminPage.id);
    if (!page) return null;
    return (
      <Tile
        key={page.id}
        surface={adminPage.surface}
        photo={pagePhoto(page)}
        title={page.label}
        href={adminPage.hub}
        action="Change this page"
        siteHref={page.href}
      >
        {adminPage.summary}
      </Tile>
    );
  }

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] ?? null;
  const today = new Date();
  const weekday = today.toLocaleDateString("en-US", { weekday: "long", timeZone: CENTER_TIME_ZONE });
  const date = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: CENTER_TIME_ZONE,
  });

  return (
    <AdminPageWidth>
      <section
        aria-labelledby="dashboard-welcome"
        className="section-navy-scene seigaiha-rings seigaiha-rings-sky enter-rise rounded-2xl px-6 py-8 text-white sm:px-10 sm:py-10"
      >
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span lang="ja" className="font-accent text-sm font-bold tracking-[0.2em] text-sky">
            おかえりなさい
          </span>
          <span aria-hidden="true" className="enter-rule h-px w-9 bg-sky" />
          <span className="font-display text-xs font-semibold tracking-[0.2em] text-sky uppercase">
            {weekday}, {date}
          </span>
        </p>
        <h1 id="dashboard-welcome" className="mt-4 font-display text-4xl sm:text-5xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-3 max-w-xl text-lg leading-relaxed text-sky">
          Everything on the website can be changed from here. Pick a page below, or
          start with one of these.
        </p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <li key={action.href}>
              <Link
                href={action.href}
                className="button-light inline-flex min-h-12 items-center px-5 text-base"
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
        {!firstName && (
          <p className="mt-6 text-base text-sky">
            We don’t have your name yet.{" "}
            <Link href="/admin/profile" className="font-semibold text-white underline underline-offset-4">
              Add your name
            </Link>{" "}
            so we can greet you properly.
          </p>
        )}
      </section>

      <section aria-labelledby="dashboard-pages" className="mt-12">
        <DashboardHeading id="dashboard-pages">Pages of the website</DashboardHeading>
        <p className="mt-2 text-lg text-ink-soft">
          Each page of the website has its own place here. Open one to change what is on it.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {ADMIN_PAGES.map(pageTile)}
        </div>
      </section>

      <section aria-labelledby="dashboard-shared" className="mt-14">
        <DashboardHeading id="dashboard-shared">On every page</DashboardHeading>
        <p className="mt-2 text-lg text-ink-soft">
          These two show at the top and bottom of every page of the website.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Tile
            surface="bg-indigo"
            photo={null}
            title="Top banner"
            href="/admin/announcement"
            action="Change the top banner"
          >
            {announcement ? (
              <>
                Showing now: <q className="text-ink">{announcement.text}</q>
              </>
            ) : (
              "No message right now, so the banner shows the next event."
            )}
          </Tile>
          <Tile
            surface="bg-magenta"
            photo={null}
            title="Contact info"
            href="/admin/contact"
            action="Change the contact info"
          >
            <p>{contact.phone}</p>
            <p>{contact.email}</p>
            <p>{contact.address}</p>
          </Tile>
        </div>
      </section>
    </AdminPageWidth>
  );
}
