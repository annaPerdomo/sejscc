import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { allowedEmails, users } from "@/db/schema";

// A JWT session outlives removal and carries a stale role, so access is
// re-read here rather than trusted from the cookie.
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  const [current] = await db
    .select({ role: users.role })
    .from(users)
    .innerJoin(allowedEmails, eq(allowedEmails.email, users.email))
    .where(eq(users.id, session.user.id));
  return current ? { ...session.user, role: current.role } : null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in again to make this change.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Only administrators can manage who has access.");
  }
  return user;
}

// Cache entries are keyed by route file, not browser URL, so revalidating
// "/events" would never match. Sweeping the layout covers both locales.
export function revalidateSite() {
  revalidatePath("/[lang]", "layout");
}
