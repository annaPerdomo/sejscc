import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf6ef] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#e5dccb] bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[#1f2a44]">
          SEJSCC Board Sign-In
        </h1>
        <p className="mt-2 text-sm text-[#6b6355]">
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
            className="w-full rounded-lg border border-[#d8cfbc] px-4 py-3 text-[#1f2a44] outline-none focus:border-[#c0392b]"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-[#c0392b] px-4 py-3 font-medium text-white hover:bg-[#a93226]"
          >
            Email me a sign-in link
          </button>
        </form>
      </div>
    </div>
  );
}
