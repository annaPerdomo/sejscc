import { redirect } from "next/navigation";
import { auth } from "@/auth";

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
    <div className="min-h-screen bg-[#faf6ef]">
      <header className="border-b border-[#e5dccb] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#1f2a44]">SEJSCC Admin</span>
          <span className="text-sm text-[#6b6355]">
            {session.user.email}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
