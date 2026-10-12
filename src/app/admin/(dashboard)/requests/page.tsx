import { auth } from "@/auth";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { RequestForm } from "./request-form";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const session = await auth();

  return (
    <AdminPageWidth>
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl text-ink">Submit a Request or Report an Issue</h1>
        <p className="mt-1 mb-8 text-stone">
          Need a change you can’t make here, spotted something that isn’t working, or have an idea
          for the site? Send it to the site’s web developer, who will reply to your email.
        </p>
        <RequestForm email={session?.user?.email ?? null} />
      </div>
    </AdminPageWidth>
  );
}
