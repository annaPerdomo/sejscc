import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getSiteSettings } from "@/lib/site-settings";
import { DonationDetailsForm } from "./donations-form";

export const dynamic = "force-dynamic";

export default async function DonationsPage() {
  const settings = await getSiteSettings();

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Donations</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        Details shown on the donation page for giving outside the online
        donation form.
      </p>

      <div className="max-w-2xl">
        <DonationDetailsForm
          initialDonation={{
            zelleRecipient: settings?.zelleRecipient ?? "",
            checkPayee: settings?.checkPayee ?? "",
            checkAddress: settings?.checkAddress ?? "",
            donateFormUrl: settings?.donateFormUrl ?? "",
          }}
        />
      </div>
    </AdminPageWidth>
  );
}
