import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-8 shadow-sm">
        <h1 className="font-display text-xl font-semibold text-ink">
          SEJSCC Board Sign-In
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Enter your email and we&apos;ll send you a sign-in link. No password
          needed.
        </p>
        <form
          className="mt-6 space-y-4"
          action={async (formData) => {
            "use server";
            await signIn("resend", {
              email: formData.get("email"),
              redirectTo: "/admin",
            });
          }}
        >
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-line px-4 py-3 text-ink outline-none focus:border-indigo"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo px-4 py-3 font-medium text-white hover:bg-indigo-deep"
          >
            Email me a sign-in link
          </button>
        </form>
      </div>
    </div>
  );
}
