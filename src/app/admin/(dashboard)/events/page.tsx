import Link from "next/link";
import Image from "next/image";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getDictionaryFor } from "@/lib/dictionaries";
import { splitByComingUp, type DatedEvent } from "@/lib/events";
import { formatEventDate } from "@/lib/format";
import { describeRepeat, type RepeatPhrases } from "@/lib/recurrence";
import { AdminBadge, type AdminBadgeTone } from "@/components/admin/admin-badge";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminEmptyState } from "@/components/admin/admin-card";
import { AdminListRow } from "@/components/admin/admin-list-row";
import { AdminPageWidth } from "@/components/admin/admin-page-width";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, { tone: AdminBadgeTone; label: string }> = {
  published: { tone: "live", label: "Published" },
  draft: { tone: "pending", label: "Draft" },
  archived: { tone: "muted", label: "Archived" },
};

export default async function AdminEventsPage() {
  const [allEvents, dict] = await Promise.all([
    db.select().from(events).orderBy(desc(events.createdAt)),
    getDictionaryFor("en"),
  ]);
  const { comingUp, past } = splitByComingUp(allEvents);

  return (
    <AdminPageWidth>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Events</h1>
          <p className="mt-1 text-stone">
            Add, edit, and publish events for the website.
          </p>
        </div>
        <AdminButtonLink href="/admin/events/new">
          + Add New Event
        </AdminButtonLink>
      </div>
      <p className="mt-3">
        <Link
          href="/admin/pages/events"
          className="inline-flex min-h-11 items-center text-base font-semibold text-indigo-deep hover:underline"
        >
          Change the words and photos on the Events page →
        </Link>
      </p>

      {allEvents.length === 0 ? (
        <AdminEmptyState title="No events yet">
          Click “Add New Event” to post your first event — all you need is a
          title.
        </AdminEmptyState>
      ) : (
        <>
          <h2 className="mt-8 font-display text-xl text-ink">Coming up</h2>
          {comingUp.length === 0 ? (
            <p className="mt-3 text-base text-ink-soft">
              Nothing is coming up. Click “Add New Event” to post the next one.
            </p>
          ) : (
            <EventRows items={comingUp} repeat={dict.events.repeat} />
          )}

          {past.length > 0 && (
            <details className="admin-disclosure group mt-10 rounded-xl border border-line bg-white">
              <summary className="flex min-h-14 items-center justify-between gap-4 px-5 font-display text-lg text-ink">
                Past events ({past.length})
                <span className="text-base font-semibold text-indigo-deep">
                  <span className="group-open:hidden">Show</span>
                  <span className="hidden group-open:inline">Hide</span>
                </span>
              </summary>
              <div className="border-t border-line px-5 pb-5">
                <p className="mt-4 text-base text-ink-soft">
                  Kept as a record. The most recent published ones also appear
                  on the website&rsquo;s Past Events page.
                </p>
                <EventRows items={past} repeat={dict.events.repeat} />
              </div>
            </details>
          )}
        </>
      )}
    </AdminPageWidth>
  );
}

function EventRows({ items, repeat }: { items: DatedEvent[]; repeat: RepeatPhrases }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map(({ event, date }) => {
        const badge = STATUS_BADGES[event.status] ?? STATUS_BADGES.draft;
        return (
          <li key={event.id}>
            <AdminListRow
              href={`/admin/events/${event.id}`}
              thumbnail={
                event.flyerUrl ? (
                  <Image src={event.flyerUrl} alt="" fill sizes="64px" className="object-contain" />
                ) : null
              }
              title={event.title}
              subtitle={[
                formatEventDate(date) ??
                  (event.status === "published"
                    ? "No date yet — not on the website"
                    : "No date set"),
                describeRepeat(event, repeat),
                event.signupUrl ? "Sign-ups open" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              badge={<AdminBadge tone={badge.tone}>{badge.label}</AdminBadge>}
            />
          </li>
        );
      })}
    </ul>
  );
}
