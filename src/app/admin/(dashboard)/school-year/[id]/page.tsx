import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolYearEvents } from "@/db/schema";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteSchoolYearEvent } from "../actions";
import { EventForm } from "../event-form";

export const dynamic = "force-dynamic";

export default async function EditSchoolYearEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event] = await db.select().from(schoolYearEvents).where(eq(schoolYearEvents.id, id));
  if (!event) notFound();

  return (
    <AdminPageWidth>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Edit School Year Event</h1>
          <p className="mt-1 text-stone">
            {!event.photoUrl
              ? "This event won't appear on the website until it has a photo."
              : !event.visible
                ? "This event is hidden from the website."
                : "This event is showing on the school page."}
          </p>
        </div>
        <ConfirmDeleteButton
          action={deleteSchoolYearEvent.bind(null, event.id)}
          label="Remove this event"
          prompt={`Remove ${event.title}? This can't be undone.`}
          redirectTo="/admin/school-year"
        />
      </div>
      <EventForm event={event} />
    </AdminPageWidth>
  );
}
