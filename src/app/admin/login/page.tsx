import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { AdminAlert } from "@/components/admin/admin-alert";
import { SectionKicker } from "@/components/section-kicker";
import { LoginBrandPanel } from "./brand-panel";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "That email isn't on the volunteer list yet. Ask a board member to add you, then try again.",
  Verification:
    "That sign-in link expired or was already used. Request a new one below.",
  Configuration:
    "Something went wrong on our end. Please try again in a few minutes, or contact the site admin.",
};

const FALLBACK_ERROR_MESSAGE =
  "Something went wrong signing you in. Please try again.";

// Auth.js raises AccessDenied both when the signIn callback returns false and
// when it throws; only the thrown case sets `cause.err`.
function signInErrorCode(error: AuthError) {
  return error.type === "AccessDenied" && !error.cause?.err
    ? "AccessDenied"
    : "Configuration";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const errorMessage = error
    ? (Object.hasOwn(ERROR_MESSAGES, error)
        ? ERROR_MESSAGES[error]
        : FALLBACK_ERROR_MESSAGE)
    : null;

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <LoginBrandPanel />

      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-sm">
          <SectionKicker accent="ログイン" caption="Sign In" className="mb-4" />
          <h1 className="font-display text-2xl font-normal tracking-wide text-ink sm:text-3xl">
            Volunteer <span className="text-indigo">Sign In</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            No password to remember — enter your email and we&apos;ll send
            you a secure sign-in link.
          </p>

          <form
            className="mt-8"
            action={async (formData) => {
              "use server";
              try {
                await signIn("resend", {
                  email: formData.get("email"),
                  redirectTo: "/admin",
                });
              } catch (error) {
                // From a server action signIn throws AuthError instead of
                // redirecting to pages.error, so without this catch the
                // visitor gets a blank server-error screen.
                if (error instanceof AuthError) {
                  redirect(`/admin/login?error=${signInErrorCode(error)}`);
                }
                throw error;
              }
            }}
          >
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-ink"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line px-4 py-3 text-ink outline-none focus:border-indigo"
            />
            {errorMessage && (
              <div className="mt-3">
                <AdminAlert>{errorMessage}</AdminAlert>
              </div>
            )}
            <button
              type="submit"
              className="button-primary mt-4 w-full rounded-lg px-4 py-3 font-display font-semibold text-white"
            >
              Email me a sign-in link
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="font-display text-xs font-semibold tracking-widest text-stone uppercase">
              How it works
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <ol className="mt-5 space-y-3">
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="font-accent text-sm font-bold text-gold"
              >
                一
              </span>
              <span className="text-sm leading-relaxed text-ink-soft">
                Enter the email you volunteer with
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="font-accent text-sm font-bold text-gold"
              >
                二
              </span>
              <span className="text-sm leading-relaxed text-ink-soft">
                Open the link we send you — it signs you in on this device
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden="true"
                className="font-accent text-sm font-bold text-gold"
              >
                三
              </span>
              <span className="text-sm leading-relaxed text-ink-soft">
                Links expire after 15 minutes and work once
              </span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
