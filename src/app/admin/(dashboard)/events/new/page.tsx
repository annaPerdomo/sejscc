import { getDictionaryFor } from "@/lib/dictionaries";
import { EventForm } from "../event-form";

export default async function NewEventPage() {
  const dict = await getDictionaryFor("en");

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Add New Event</h1>
      <p className="mt-1 mb-8 text-stone">
        Upload a flyer, give the event a title, and hit Publish — that&apos;s
        it.
      </p>
      <EventForm repeatPhrases={dict.events.repeat} />
    </div>
  );
}
