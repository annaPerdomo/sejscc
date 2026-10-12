import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getSiteSettings } from "@/lib/site-settings";
import { AboutVideoForm } from "./video-form";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const settings = await getSiteSettings();

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Home page videos</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        The YouTube videos that play in the &ldquo;Our History&rdquo; section
        of the home page.
      </p>

      <div className="max-w-2xl">
        <AboutVideoForm initialUrls={settings?.aboutVideoUrls ?? []} />
      </div>
    </AdminPageWidth>
  );
}
