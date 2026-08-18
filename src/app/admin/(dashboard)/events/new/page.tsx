import { EventForm } from "../event-form";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Add New Event</h1>
      <p className="mt-1 mb-8 text-stone">
        Upload a flyer, give the event a title, and hit Publish — that&apos;s
        it.
      </p>
      <EventForm />
    </div>
  );
}
