import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getSiteSettings } from "@/lib/site-settings";
import { AnnouncementForm } from "./announcement-form";

export const dynamic = "force-dynamic";

export default async function AnnouncementPage() {
  const settings = await getSiteSettings();

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Announcement bar</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        A short message shown at the very top of every page. When it&apos;s
        empty, the bar shows the next event instead.
      </p>

      <div className="max-w-2xl">
        <AnnouncementForm
          initialAnnouncement={{
            text: settings?.announcementText ?? "",
            textJa: settings?.announcementTextJa ?? "",
            url: settings?.announcementUrl ?? "",
            until: settings?.announcementUntil
              ? settings.announcementUntil.toISOString().slice(0, 10)
              : "",
          }}
        />
      </div>
    </AdminPageWidth>
  );
}
