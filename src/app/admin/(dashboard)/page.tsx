import Image from "next/image";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { formatEventDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  draft: "bg-amber-100 text-amber-800",
  archived: "bg-gray-100 text-gray-600",
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
          <h1 className="font-serif text-3xl text-ink">Events</h1>
          <p className="mt-1 text-stone">
            Add, edit, and publish events for the website.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-vermilion px-5 py-3 font-semibold text-white hover:bg-vermilion-deep"
        >
          + Add New Event
        </Link>
      </div>

      {allEvents.length === 0 ? (
        <div className="mt-10 rounded-xl border border-line bg-white p-10 text-center">
          <p className="font-serif text-xl text-ink">No events yet</p>
          <p className="mt-2 text-stone">
            Click “Add New Event” to post your first event — all you need is a
            flyer and a title.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {allEvents.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/events/${event.id}`}
                className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 transition hover:border-vermilion/50 hover:shadow-sm"
              >
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-line bg-mist">
                  {event.flyerUrl && (
                    <Image
                      src={event.flyerUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover object-top"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-sm text-stone">
                    {formatEventDate(event.startAt) ?? "No date set"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    STATUS_STYLES[event.status] ?? STATUS_STYLES.draft
                  }`}
                >
                  {event.status}
                </span>
                <span className="text-sm font-semibold text-vermilion">
                  Edit →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
