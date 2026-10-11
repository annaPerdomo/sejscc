import type { ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { boardMembers, volunteerSection } from "@/db/schema";
import { EDITABLE_PAGES, type EditablePage } from "@/lib/editable-pages";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { excerpt, formatEventDate, isUploadedFileUrl } from "@/lib/format";
import { boardPhoto } from "@/lib/photos";
import { getAllSchoolLevels } from "@/lib/school-levels";
import { getAllSchoolYearEvents } from "@/lib/school-year-events";
import { getAnnouncement, getCenterContact } from "@/lib/site-settings";
import { getSitePhotos } from "@/lib/site-photos";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { byAdminPageOrder, PAGE_TONES } from "@/components/admin/admin-page-tone";
import { AdminPageWidth } from "@/components/admin/admin-page-width";

export const dynamic = "force-dynamic";

type PhotoSrc = ImageProps["src"];

const PREVIEW_COUNT = 3;

function firstUploaded(urls: (string | null)[]): string | null {
  return urls.find((url): url is string => url !== null && isUploadedFileUrl(url)) ?? null;
}

function sectionsSummary(page: EditablePage): string {
  const labels = page.sections
    .filter((section) => section.fields.length > 0 || section.photos.length > 0)
    .map((section) => section.label);
  const shown = labels.slice(0, 3).join(", ");
  return labels.length > 3 ? `${shown} and more` : shown;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function DashboardRow({
  href,
  photo,
  title,
  detail,
}: {
  href: string;
  photo: PhotoSrc | null;
  title: string;
  detail?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-lg border border-ink/10 bg-white p-3 hover:border-indigo"
      >
        {photo && (
          <span className="relative aspect-photo w-16 shrink-0 overflow-clip rounded-md bg-mist sm:w-24">
            <Image src={photo} alt="" fill sizes="(min-width: 640px) 6rem, 4rem" className="object-cover" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink group-hover:underline">{title}</span>
          {detail && <span className="mt-0.5 block text-sm text-ink-soft">{detail}</span>}
        </span>
        <span aria-hidden="true" className="shrink-0 text-2xl text-indigo">
          ›
        </span>
      </Link>
    </li>
  );
}

function RowList({ heading, children }: { heading?: string; children: ReactNode }) {
  return (
    <div>
      {heading && (
        <h4 className="mb-2 font-display text-base font-semibold text-ink-soft">{heading}</h4>
      )}
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function PageCard({ page, children }: { page: EditablePage; children: ReactNode }) {
  const headingId = `page-card-${page.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col gap-5 rounded-xl border border-ink/10 p-6 ${PAGE_TONES[page.id].surface}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id={headingId} className="font-display text-2xl text-ink">
          {page.label}
        </h3>
        <Link
          href={page.href}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4 hover:text-indigo-deep"
        >
          See it on the website
        </Link>
      </div>
      {children}
    </section>
  );
}

function PageSketch({ highlight }: { highlight: "top" | "bottom" }) {
  const band = "h-3 rounded-sm bg-indigo";
  const line = "h-1.5 rounded-full bg-line";
  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-20 shrink-0 flex-col gap-1.5 rounded-lg border-2 border-line bg-white p-1.5"
    >
      <div className={highlight === "top" ? band : line} />
      <div className={line} />
      <div className={`${line} w-3/4`} />
      <div className={line} />
      <div className={`${line} w-2/3`} />
      <div className="flex-1" />
      <div className={highlight === "bottom" ? band : line} />
    </div>
  );
}

function SharedPartCard({
  title,
  highlight,
  where,
  children,
  href,
  action,
}: {
  title: string;
  highlight: "top" | "bottom";
  where: string;
  children: ReactNode;
  href: string;
  action: string;
}) {
  return (
    <AdminCard>
      <div className="flex flex-col gap-5 sm:flex-row">
        <PageSketch highlight={highlight} />
        <div className="min-w-0">
          <h3 className="font-display text-2xl text-ink">{title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{where}</p>
          <div className="mt-3 text-base break-words text-ink">{children}</div>
        </div>
      </div>
      <div className="mt-6 flex flex-col">
        <AdminButtonLink href={href}>{action}</AdminButtonLink>
      </div>
    </AdminCard>
  );
}

export default async function AdminDashboard() {
  const session = await auth();
  const [
    activeGroups,
    upcomingEvents,
    allBoardMembers,
    boardSections,
    allSchoolLevels,
    allSchoolYearEvents,
    announcement,
    sitePhotos,
    contact,
  ] = await Promise.all([
    getActiveGroups(),
    getUpcomingEvents(),
    db.select({ visible: boardMembers.visible }).from(boardMembers),
    db.select({ photoUrl: volunteerSection.photoUrl }).from(volunteerSection),
    getAllSchoolLevels(),
    getAllSchoolYearEvents(),
    getAnnouncement(),
    getSitePhotos(),
    getCenterContact(),
  ]);

  const hiddenNote = (hidden: number) => (hidden > 0 ? ` (${hidden} hidden)` : "");

  const boardShowing = allBoardMembers.filter((member) => member.visible).length;
  const boardHidden = allBoardMembers.length - boardShowing;

  const visibleLevels = allSchoolLevels.filter((level) => level.visible);
  const levelsHidden = allSchoolLevels.length - visibleLevels.length;

  const yearShowing = allSchoolYearEvents.filter((event) => event.visible && event.photoUrl);
  const yearNeedPhoto = allSchoolYearEvents.filter((event) => !event.photoUrl).length;

  function pagePhoto(page: EditablePage): PhotoSrc | null {
    const slot = page.sections.flatMap((section) => section.photos)[0];
    return slot ? (sitePhotos.get(slot.id)?.url ?? slot.defaultSrc) : null;
  }

  function wordsAndPhotosRow(page: EditablePage) {
    return (
      <DashboardRow
        href={`/admin/pages/${page.id}`}
        photo={pagePhoto(page)}
        title="Words & photos"
        detail={sectionsSummary(page)}
      />
    );
  }

  function groupPhoto(group: (typeof activeGroups)[number]): string | null {
    return firstUploaded([...group.photoUrls, group.imageIsLogo ? null : group.imageUrl]);
  }

  function pageContent(page: EditablePage): ReactNode {
    switch (page.id) {
      case "events":
        return (
          <>
            <AdminButtonLink href="/admin/events/new">+ Add a new event</AdminButtonLink>
            {upcomingEvents.length > 0 ? (
              <RowList heading="Coming up next">
                {upcomingEvents.slice(0, PREVIEW_COUNT).map((event) => (
                  <DashboardRow
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    photo={firstUploaded([event.flyerUrl])}
                    title={event.title}
                    detail={formatEventDate(event.startAt) ?? undefined}
                  />
                ))}
              </RowList>
            ) : (
              <p className="text-base text-ink">No events are coming up.</p>
            )}
            <AdminButtonLink href="/admin/events" variant="secondary">
              See all events
            </AdminButtonLink>
            <RowList heading="Also on this page">{wordsAndPhotosRow(page)}</RowList>
          </>
        );
      case "groups":
        return (
          <>
            <AdminButtonLink href="/admin/groups/new">+ Add a new group</AdminButtonLink>
            {activeGroups.length > 0 && (
              <RowList heading="Some of the groups">
                {activeGroups.slice(0, PREVIEW_COUNT).map((group) => (
                  <DashboardRow
                    key={group.id}
                    href={`/admin/groups/${group.id}`}
                    photo={groupPhoto(group)}
                    title={group.name}
                    detail={group.description ? excerpt(group.description, 60) : undefined}
                  />
                ))}
              </RowList>
            )}
            <AdminButtonLink href="/admin/groups" variant="secondary">
              See all groups
            </AdminButtonLink>
            <RowList heading="Also on this page">{wordsAndPhotosRow(page)}</RowList>
          </>
        );
      case "home":
        return (
          <RowList>
            <DashboardRow
              href="/admin/board"
              photo={firstUploaded(boardSections.map((section) => section.photoUrl)) ?? boardPhoto}
              title="Board of Directors"
              detail={`${plural(boardShowing, "member", "members")} showing${hiddenNote(boardHidden)}`}
            />
            {wordsAndPhotosRow(page)}
          </RowList>
        );
      case "donate":
        return (
          <RowList>
            <DashboardRow
              href="/admin/donations"
              photo={null}
              title="Ways to donate"
              detail="The online form, Zelle and the mailing address for checks"
            />
            {wordsAndPhotosRow(page)}
          </RowList>
        );
      case "school":
        return (
          <RowList>
            <DashboardRow
              href="/admin/levels"
              photo={firstUploaded(visibleLevels.map((level) => level.photoUrl))}
              title="Classes"
              detail={`${plural(visibleLevels.length, "class", "classes")} showing${hiddenNote(levelsHidden)}`}
            />
            <DashboardRow
              href="/admin/school-year"
              photo={firstUploaded(yearShowing.map((event) => event.photoUrl))}
              title="The school year"
              detail={`${plural(yearShowing.length, "event", "events")} showing${yearNeedPhoto > 0 ? `, ${yearNeedPhoto} still need a photo` : ""}`}
            />
            {wordsAndPhotosRow(page)}
          </RowList>
        );
    }
  }

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] ?? null;
  const today = new Date();

  return (
    <AdminPageWidth>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          {firstName ? (
            <>
              Welcome back, <span className="text-indigo">{firstName.toUpperCase()}</span>
            </>
          ) : (
            "Welcome back"
          )}
        </h1>
        <div className="text-right">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-stone uppercase">
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "America/Los_Angeles",
            })}
          </p>
          <p className="font-display text-sm text-ink">
            {today.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "America/Los_Angeles",
            })}
          </p>
        </div>
      </div>

      {!firstName && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-cream px-5 py-4">
          <p className="text-sm text-ink-soft">
            We don’t have your name yet — add it so the site can greet you by
            name.
          </p>
          <AdminButtonLink href="/admin/profile" variant="secondary">
            Add your name
          </AdminButtonLink>
        </div>
      )}

      <section aria-labelledby="dashboard-pages" className="mt-10">
        <h2 id="dashboard-pages" className="font-display text-2xl text-ink">
          Pages of the website
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {[...EDITABLE_PAGES].sort(byAdminPageOrder).map((page) => (
            <PageCard key={page.id} page={page}>
              {pageContent(page)}
            </PageCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="dashboard-shared" className="mt-14">
        <h2 id="dashboard-shared" className="font-display text-2xl text-ink">
          Top &amp; bottom of every page
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <SharedPartCard
            title="Top banner"
            highlight="top"
            where="A short message in a strip above the menu."
            href="/admin/announcement"
            action="Change the top banner"
          >
            {announcement
              ? `Showing now: “${announcement.text}”`
              : "No message right now, so the banner shows the next event."}
          </SharedPartCard>
          <SharedPartCard
            title="Contact info"
            highlight="bottom"
            where="At the bottom of every page, and on the home and donations pages."
            href="/admin/contact"
            action="Change the contact info"
          >
            <p>{contact.phone}</p>
            <p>{contact.email}</p>
            <p>{contact.address}</p>
          </SharedPartCard>
        </div>
      </section>
    </AdminPageWidth>
  );
}
