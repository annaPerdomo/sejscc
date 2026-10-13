import type { ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { EDITABLE_PAGES, type EditablePage } from "@/lib/editable-pages";
import { getUpcomingEvents } from "@/lib/events";
import { getAnnouncement, getCenterContact } from "@/lib/site-settings";
import { getSitePhotos, slotPhoto } from "@/lib/site-photos";
import { buttonClass } from "@/components/admin/admin-button";
import { BallIcon, CalendarPlusIcon, MegaphoneIcon } from "@/components/admin/admin-icons";
import { ADMIN_PAGES, type AdminPage } from "@/components/admin/admin-pages";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { ADMIN_TUTORIAL_URL, ADMIN_TUTORIAL_VIDEO_ID } from "@/components/admin/admin-tutorial";
import { SiteVideo } from "@/components/site-video";
import { SectionKicker } from "@/components/section-kicker";

export const dynamic = "force-dynamic";

type PhotoSrc = ImageProps["src"];

const CENTER_TIME_ZONE = "America/Los_Angeles";

const QUICK_ACTIONS = [
  {
    href: "/admin/events/new",
    label: "Add a new event",
    detail: "Post the date, place and flyer.",
    icon: CalendarPlusIcon,
    surface: "from-peach",
    ring: "ring-peach",
  },
  {
    href: "/admin/groups/new",
    label: "Add a sport or class",
    detail: "Put a new group on the list.",
    icon: BallIcon,
    surface: "from-lilac",
    ring: "ring-lilac",
  },
  {
    href: "/admin/announcement",
    label: "Change the top banner",
    detail: "The message at the top of every page.",
    icon: MegaphoneIcon,
    surface: "from-azure",
    ring: "ring-azure",
  },
];

function DashboardHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-5">
      <h2 id={id} className="font-display text-2xl text-ink sm:text-3xl">
        {children}
      </h2>
      <span aria-hidden="true" className="h-px min-w-8 flex-1 bg-gradient-to-r from-gold/60 to-transparent" />
    </div>
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
    <article className="group surface-card surface-card-link relative flex flex-col overflow-clip">
      {photo && (
        <div className="relative aspect-band overflow-clip bg-mist">
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1280px) 30rem, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink-deep/35 via-transparent to-transparent" />
        </div>
      )}
      <span aria-hidden="true" className={`block h-1.5 ${surface}`} />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <h3 className="font-display text-2xl text-ink">{title}</h3>
        <div className="text-lg leading-relaxed text-ink-soft">{children}</div>
        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
          <Link
            href={href}
            className={`card-stretch text-lg shadow-lg shadow-indigo/25 transition-colors ${buttonClass("primary")}`}
          >
            {action}
            <span className="sr-only"> — {title}</span>
          </Link>
          {siteHref && (
            <Link
              href={siteHref}
              className="link-arrow relative z-10 inline-flex min-h-11 items-center text-base font-semibold text-indigo-deep underline decoration-indigo/40 underline-offset-4 hover:text-indigo hover:decoration-indigo"
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
  const [announcement, sitePhotos, contact, [nextEvent]] = await Promise.all([
    getAnnouncement(),
    getSitePhotos(),
    getCenterContact(),
    getUpcomingEvents(1),
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
    <>
      {/* Cancels the padding in layout.tsx so the welcome runs edge to edge. */}
      <section
        aria-labelledby="dashboard-welcome"
        className="relative isolate -mx-5 -mt-8 overflow-clip sm:-mx-8 lg:-mx-10 lg:-mt-10"
      >
        <div aria-hidden="true" className="section-wash-history absolute inset-0 -z-10 mask-b-from-80%">
          {/* From lg the photo keeps its own 16:9 shape and is lifted further on
              wider bands, which scale it up, so the school sign (the photo's
              upper middle) lands above the band's bottom fade. */}
          <div className="absolute inset-0 lg:bottom-auto lg:aspect-video lg:-translate-y-1/10 xl:-translate-y-1/8 2xl:-translate-y-1/5">
            <Image
              src={slotPhoto(sitePhotos, "home.events-backdrop", "", "en").src}
              alt=""
              fill
              preload
              sizes="(min-width: 1024px) calc(100vw - 18rem), 100vw"
              className="object-cover object-right-top"
            />
          </div>
        </div>
        <div className="px-5 pt-12 pb-20 sm:px-8 sm:pt-16 sm:pb-24 lg:px-10">
          <div className="enter-rise mx-auto max-w-5xl">
            <div className="relative w-fit max-w-full">
              {/* Holds every text color at AA over whatever photo sits behind the
                  copy; 88% is the home page's tuned wash. */}
              <div aria-hidden="true" className="absolute -inset-12 -z-10 bg-paper/88 blur-2xl" />
              <SectionKicker accent="おかえりなさい" caption={`${weekday}, ${date}`} tone="magenta" size="lg" entrance="load" />
              <h1
                id="dashboard-welcome"
                className="mt-4 max-w-xl font-display text-4xl font-normal tracking-[0.02em] break-words text-ink sm:text-5xl"
              >
                {firstName ? (
                  <>
                    <span className="text-indigo">Welcome back,</span> {firstName}
                  </>
                ) : (
                  <span className="text-indigo">Welcome back</span>
                )}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
                Thank you for keeping our community connected.
              </p>
              {!firstName && (
                <p className="mt-3 text-base text-ink-soft">
                  We don’t have your name yet.{" "}
                  <Link href="/admin/profile" className="font-semibold text-indigo-deep underline underline-offset-4">
                    Add your name
                  </Link>{" "}
                  so we can greet you properly.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <AdminPageWidth>
        <section aria-labelledby="dashboard-quick">
          <div className="flex items-center gap-4">
            <h2
              id="dashboard-quick"
              className="font-display text-sm font-semibold tracking-[0.18em] text-stone uppercase"
            >
              The most common updates
            </h2>
            <span aria-hidden="true" className="h-px min-w-8 flex-1 bg-gradient-to-r from-gold/60 to-transparent" />
          </div>
          <ul className="enter-stagger mt-4 grid gap-4 sm:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <li key={action.href} className="flex">
                <article
                  className={`surface-card surface-card-link relative flex w-full items-center gap-4 overflow-clip bg-gradient-to-br to-white p-5 sm:flex-col sm:items-start sm:gap-5 sm:p-6 ${action.surface}`}
                >
                  <action.icon className="pointer-events-none absolute -right-5 -bottom-5 hidden h-32 w-32 text-ink/5 sm:block" />
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-deep shadow-md ring-4 ${action.ring}`}
                  >
                    <action.icon className="h-8 w-8" />
                  </span>
                  <span className="min-w-0">
                    <Link
                      href={action.href}
                      className="card-stretch block font-display text-xl font-semibold text-ink"
                    >
                      {action.label}
                    </Link>
                    <span className="mt-1 block text-base text-ink-soft">{action.detail}</span>
                  </span>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="dashboard-tutorial" className="mt-12">
          <DashboardHeading id="dashboard-tutorial">How-to video</DashboardHeading>
          <p className="mt-2 text-lg text-ink-soft">
            A walk-through of how to change the website. Come back to it any time, or{" "}
            <a
              href={ADMIN_TUTORIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-deep underline underline-offset-4"
            >
              open it on YouTube
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            to watch it beside this page while you work.
          </p>
          <SiteVideo
            videoId={ADMIN_TUTORIAL_VIDEO_ID}
            title="How to change the website"
            className="mt-6 max-w-3xl"
          />
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
              surface="bg-gradient-to-r from-indigo to-sky"
              photo={null}
              title="Top banner"
              href="/admin/announcement"
              action="Change the top banner"
            >
              {announcement ? (
                <>
                  Showing now: <q className="text-ink">{announcement.text}</q>
                </>
              ) : nextEvent ? (
                <>
                  Showing the next event automatically: <q className="text-ink">{nextEvent.title}</q>
                </>
              ) : (
                "Set to show the next event automatically, but no events are coming up, so the bar is empty."
              )}
            </Tile>
            <Tile
              surface="bg-gradient-to-r from-magenta to-blossom"
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
    </>
  );
}
