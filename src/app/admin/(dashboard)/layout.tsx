import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MadeWithLove } from "@/components/made-with-love";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <>
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar
          user={{
            name: session.user.name ?? null,
            email: session.user.email ?? null,
            role: session.user.role,
          }}
        />
        <main className="flex-1 bg-paper">
          <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
      <footer className="border-t border-line bg-white px-4 py-4 text-center">
        <MadeWithLove madeWith="Made with" by="by" className="text-xs text-stone" />
      </footer>
    </>
  );
}
