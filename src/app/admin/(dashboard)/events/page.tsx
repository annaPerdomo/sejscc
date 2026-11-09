import Image from "next/image";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getDictionaryFor } from "@/lib/dictionaries";
import { splitByComingUp, type DatedEvent } from "@/lib/events";
import { formatEventDate } from "@/lib/format";
import { describeRepeat, type RepeatPhrases } from "@/lib/recurrence";
import { AdminBadge, type AdminBadgeTone } from "@/components/admin/admin-badge";
import { AdminActionTiles } from "@/components/admin/admin-action-tile";
import { AdminEmptyState } from "@/components/admin/admin-card";
import { AdminDisclosure } from "@/components/admin/admin-disclosure";
import { CalendarPlusIcon, PencilIcon } from "@/components/admin/admin-icons";
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
      <h1 className="font-display text-3xl text-ink">Events</h1>
      <p className="mt-1 text-lg text-stone">
        Add an event, or change the words and photos around the events on the website.
      </p>
      <div className="mt-6">
        <AdminActionTiles
          actions={[
            {
              href: "/admin/events/new",
              label: "Add an event",
              detail: "Post the date, place and flyer.",
              icon: CalendarPlusIcon,
              surface: "from-peach",
              ring: "ring-peach",
            },
            {
              href: "/admin/pages/events",
              label: "Change the Events page",
              detail: "Tap any words or photos on the website to change them.",
              icon: PencilIcon,
              surface: "from-azure",
              ring: "ring-azure",
            },
          ]}
        />
      </div>

      {allEvents.length === 0 ? (
        <AdminEmptyState title="No events yet">
          Click “Add an event” to post your first event — all you need is a
          title.
        </AdminEmptyState>
      ) : (
        <>
          <h2 className="mt-8 font-display text-xl text-ink">Coming up</h2>
          {comingUp.length === 0 ? (
            <p className="mt-3 text-base text-ink-soft">
              Nothing is coming up. Click “Add an event” to post the next one.
            </p>
          ) : (
            <EventRows items={comingUp} repeat={dict.events.repeat} />
          )}

          {past.length > 0 && (
            <AdminDisclosure className="mt-10" summary={`Past events (${past.length})`}>
              <p className="mt-4 text-base text-ink-soft">
                Kept as a record. The most recent published ones also appear
                on the website&rsquo;s Past Events page.
              </p>
              <EventRows items={past} repeat={dict.events.repeat} />
            </AdminDisclosure>
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
