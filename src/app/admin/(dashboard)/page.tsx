import type { ReactNode } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { boardMembers } from "@/db/schema";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { getAnnouncement } from "@/lib/site-settings";
import { getSitePhotos } from "@/lib/site-photos";
import { getSiteTextOverrides } from "@/lib/site-text";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminPageWidth } from "@/components/admin/admin-page-width";

export const dynamic = "force-dynamic";

function SummaryCard({
  kanji,
  title,
  children,
  addHref,
  addLabel,
  viewHref,
  viewLabel,
}: {
  kanji: string;
  title: string;
  children: ReactNode;
  addHref: string;
  addLabel: string;
  viewHref: string;
  viewLabel: string;
}) {
  return (
    <AdminCard>
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-mist font-accent text-xl font-bold text-indigo"
        >
          {kanji}
        </span>
        <h2 className="font-display text-xl text-ink">{title}</h2>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-stone">{children}</p>
      <div className="mt-6 flex flex-col gap-3">
        <AdminButtonLink href={addHref}>{addLabel}</AdminButtonLink>
        <AdminButtonLink href={viewHref} variant="secondary">
          {viewLabel}
        </AdminButtonLink>
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
    announcement,
    siteTextOverrides,
    sitePhotos,
  ] = await Promise.all([
    getActiveGroups(),
    getUpcomingEvents(),
    db.select({ visible: boardMembers.visible }).from(boardMembers),
    getAnnouncement(),
    getSiteTextOverrides(),
    getSitePhotos(),
  ]);

  const boardMemberCounts = {
    showing: allBoardMembers.filter((member) => member.visible).length,
    hidden: allBoardMembers.filter((member) => !member.visible).length,
  };

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] ?? null;
  const today = new Date();

  return (
    <AdminPageWidth>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            {firstName ? (
              <>
                Welcome back,{" "}
                <span className="text-indigo">{firstName.toUpperCase()}</span>
              </>
            ) : (
              "Welcome back"
            )}
          </h1>
          <p className="mt-2 text-stone">What would you like to do today?</p>
        </div>
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

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <SummaryCard
          kanji="祭"
          title="Events"
          addHref="/admin/events/new"
          addLabel="+ Add a new event"
          viewHref="/admin/events"
          viewLabel="View & edit all events"
        >
          {upcomingEvents.length} upcoming{" "}
          {upcomingEvents.length === 1 ? "event is" : "events are"} on the
          community calendar.
        </SummaryCard>
        <SummaryCard
          kanji="部"
          title="Sports & Classes"
          addHref="/admin/groups/new"
          addLabel="+ Add a new group"
          viewHref="/admin/groups"
          viewLabel="View & edit all groups"
        >
          {activeGroups.length}{" "}
          {activeGroups.length === 1 ? "group is" : "groups are"} listed on the
          community page.
        </SummaryCard>
        <SummaryCard
          kanji="志"
          title="Board of Directors"
          addHref="/admin/board"
          addLabel="Edit the section"
          viewHref="/#board"
          viewLabel="See it on the website"
        >
          {`${boardMemberCounts.showing} board ${boardMemberCounts.showing === 1 ? "member is" : "members are"} showing on the home page${boardMemberCounts.hidden > 0 ? ` (${boardMemberCounts.hidden} hidden)` : ""}.`}
        </SummaryCard>
        <SummaryCard
          kanji="報"
          title="Announcement bar"
          addHref="/admin/announcement"
          addLabel="Change the announcement"
          viewHref="/"
          viewLabel="See it on the website"
        >
          {announcement
            ? `Showing: “${announcement.text}”`
            : "Not showing. The bar shows the next event."}
        </SummaryCard>
        <SummaryCard
          kanji="文"
          title="Words on the site"
          addHref="/admin/words"
          addLabel="Change the words"
          viewHref="/"
          viewLabel="See the website"
        >
          {siteTextOverrides.size > 0
            ? `${siteTextOverrides.size} sentence${siteTextOverrides.size === 1 ? "" : "s"} ${siteTextOverrides.size === 1 ? "has" : "have"} been changed from the original.`
            : "Every sentence is still the original."}
        </SummaryCard>
        <SummaryCard
          kanji="写"
          title="Photos"
          addHref="/admin/photos"
          addLabel="Change a photo"
          viewHref="/"
          viewLabel="See the website"
        >
          {sitePhotos.size > 0
            ? `${sitePhotos.size} photo${sitePhotos.size === 1 ? "" : "s"} ${sitePhotos.size === 1 ? "has" : "have"} been changed from the originals.`
            : "Every photo is still the original."}
        </SummaryCard>
      </div>
    </AdminPageWidth>
  );
}
