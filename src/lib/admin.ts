import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");
  return session.user;
}

// Cache entries are keyed by route file, not browser URL, so revalidating
// "/events" would never match. Sweeping the layout covers both locales.
export function revalidateSite() {
  revalidatePath("/[lang]", "layout");
}
