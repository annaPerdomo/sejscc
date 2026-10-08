import { auth } from "@/auth";
import { ProfileForm } from "./profile-form";
import { AdminPageWidth } from "@/components/admin/admin-page-width";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Your Profile</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        This is how the site greets you when you sign in, and how other board
        members will see you listed.
      </p>
      <ProfileForm
        currentName={user?.name ?? ""}
        email={user?.email ?? null}
        role={user?.role ?? "editor"}
      />
    </AdminPageWidth>
  );
}
