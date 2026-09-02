import { getDictionaryFor } from "@/lib/dictionaries";
import { EventForm } from "../event-form";

export default async function NewEventPage() {
  const dict = await getDictionaryFor("en");

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Add New Event</h1>
      <p className="mt-1 mb-8 text-stone">
        Start with the title. Everything else is optional — add what you have
        and hit Publish.
      </p>
      <EventForm
        repeatPhrases={dict.events.repeat}
        atCenterLabel={dict.events.atCenter}
      />
    </div>
  );
}
