import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getDictionaryFor } from "@/lib/dictionaries";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { EventForm } from "../event-form";
import { deleteEvent } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) notFound();
  const dict = await getDictionaryFor("en");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Edit Event</h1>
          <p className="mt-1 text-stone">
            {event.status === "published"
              ? "This event is live on the website."
              : "This event is a draft — visitors can’t see it yet."}
          </p>
        </div>
        <ConfirmDeleteButton
          action={deleteEvent.bind(null, event.id)}
          label="Delete event"
          prompt="Delete this event for good?"
          redirectTo="/admin/events"
        />
      </div>
      <EventForm
        event={event}
        repeatPhrases={dict.events.repeat}
        atCenterLabel={dict.events.atCenter}
      />
    </div>
  );
}
