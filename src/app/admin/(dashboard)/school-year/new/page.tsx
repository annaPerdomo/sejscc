import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { EventForm } from "../event-form";

export default function NewSchoolYearEventPage() {
  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Add a School Year Event</h1>
      <p className="mt-1 mb-8 text-stone">
        Fill in the details below, then choose Save.
      </p>
      <EventForm />
    </AdminPageWidth>
  );
}
