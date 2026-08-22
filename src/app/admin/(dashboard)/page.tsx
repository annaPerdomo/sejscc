import type { ReactNode } from "react";
import { auth } from "@/auth";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";

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
  const [activeGroups, upcomingEvents] = await Promise.all([
    getActiveGroups(),
    getUpcomingEvents(),
  ]);

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] ?? null;
  const today = new Date();

  return (
    <div>
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
          kanji="部"
          title="Groups"
          addHref="/admin/groups/new"
          addLabel="+ Add a new group"
          viewHref="/admin/groups"
          viewLabel="View & edit all groups"
        >
          {activeGroups.length} {activeGroups.length === 1 ? "group is" : "groups are"}{" "}
          listed on the community page.
        </SummaryCard>
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
      </div>
    </div>
  );
}
