import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/admin";
import { getSiteSettings } from "@/lib/site-settings";
import { AccessRequestEmailForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin");

  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Settings</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        Site-wide details that don&apos;t belong to a single page.
      </p>

      <div className="max-w-2xl">
        <AccessRequestEmailForm
          initialEmail={settings?.accessRequestEmail ?? ""}
        />
      </div>
    </div>
  );
}
