import Image from "next/image";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { formatEventDate } from "@/lib/format";
import { AdminBadge, type AdminBadgeTone } from "@/components/admin/admin-badge";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminEmptyState } from "@/components/admin/admin-card";
import { AdminListRow } from "@/components/admin/admin-list-row";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, { tone: AdminBadgeTone; label: string }> = {
  published: { tone: "live", label: "Published" },
  draft: { tone: "pending", label: "Draft" },
  archived: { tone: "muted", label: "Archived" },
};

export default async function AdminDashboard() {
  const allEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt));

  return (
    <div>
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

      {allEvents.length === 0 ? (
        <AdminEmptyState title="No events yet">
          Click “Add New Event” to post your first event — all you need is a
          flyer and a title.
        </AdminEmptyState>
      ) : (
        <ul className="mt-8 space-y-3">
          {allEvents.map((event) => {
            const badge = STATUS_BADGES[event.status] ?? STATUS_BADGES.draft;
            return (
              <li key={event.id}>
                <AdminListRow
                  href={`/admin/events/${event.id}`}
                  thumbnail={
                    event.flyerUrl ? (
                      <Image
                        src={event.flyerUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    ) : null
                  }
                  title={event.title}
                  subtitle={formatEventDate(event.startAt) ?? "No date set"}
                  badge={
                    <AdminBadge tone={badge.tone}>{badge.label}</AdminBadge>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
