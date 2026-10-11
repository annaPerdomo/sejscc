import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getUpcomingEvents } from "@/lib/events";
import { formatEventDate } from "@/lib/format";
import { getAnnouncement, getSiteSettings } from "@/lib/site-settings";
import { AnnouncementForm } from "./announcement-form";

export const dynamic = "force-dynamic";

export default async function AnnouncementPage() {
  const [settings, liveAnnouncement, [nextEvent]] = await Promise.all([
    getSiteSettings(),
    getAnnouncement(),
    getUpcomingEvents(1),
  ]);

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Top banner</h1>
      <p className="mt-1 mb-8 max-w-xl text-lg text-ink-soft">
        The thin blue bar at the very top of every page. It can point people to
        the next event on its own, or carry a message you write.
      </p>

      <div className="max-w-2xl">
        <AnnouncementForm
          nextEvent={
            nextEvent
              ? {
                  title: nextEvent.title,
                  date: formatEventDate(nextEvent.startAt),
                  hasSignup: Boolean(nextEvent.signupUrl),
                }
              : null
          }
          initialMode={liveAnnouncement ? "message" : "next-event"}
          initialAnnouncement={{
            text: settings?.announcementText ?? "",
            textJa: settings?.announcementTextJa ?? "",
            url: settings?.announcementUrl ?? "",
            linkLabel: settings?.announcementLinkLabel ?? "",
            until: liveAnnouncement && settings?.announcementUntil
              ? settings.announcementUntil.toISOString().slice(0, 10)
              : "",
          }}
        />
      </div>
    </AdminPageWidth>
  );
}
