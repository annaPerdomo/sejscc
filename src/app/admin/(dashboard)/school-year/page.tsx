import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminEmptyState } from "@/components/admin/admin-card";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getAllSchoolYearEvents } from "@/lib/school-year-events";
import { EventList } from "./event-list";

export const dynamic = "force-dynamic";

export default async function AdminSchoolYearPage() {
  const events = await getAllSchoolYearEvents();

  return (
    <AdminPageWidth>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">School Year</h1>
          <p className="mt-1 text-stone">
            The cultural events on the Japanese School page, season by
            season. An event only appears on the website once it has a
            photo.
          </p>
        </div>
        <AdminButtonLink href="/admin/school-year/new">
          + Add an event
        </AdminButtonLink>
      </div>

      {events.length === 0 ? (
        <AdminEmptyState title="No school year events yet">
          Click “+ Add an event” to add the first one.
        </AdminEmptyState>
      ) : (
        <EventList events={events} />
      )}
    </AdminPageWidth>
  );
}
