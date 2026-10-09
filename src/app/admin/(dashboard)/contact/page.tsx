import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getCenterContact } from "@/lib/site-settings";
import { ContactDetailsForm } from "./contact-form";

export const dynamic = "force-dynamic";

export default async function ContactDetailsPage() {
  const contact = await getCenterContact();

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Contact details</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        These appear in the footer, the Contact section of the home page, and
        on the donation page.
      </p>

      <div className="max-w-2xl">
        <ContactDetailsForm initialContact={contact} />
      </div>
    </AdminPageWidth>
  );
}
