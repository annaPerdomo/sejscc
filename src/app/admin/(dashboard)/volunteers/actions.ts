"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { allowedEmails, verificationTokens } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

// The form caps this too, but the column is unbounded text and a server
// action can be called directly, so the ceiling has to be enforced here.
const MAX_EMAIL_LENGTH = 254;

export async function addAllowedEmail(raw: string) {
  await requireAdmin();
  const email = raw.trim().toLowerCase();
  if (
    email.length > MAX_EMAIL_LENGTH ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      "That doesn’t look like an email address. It should be something like name@example.org."
    );
  }
  const [inserted] = await db
    .insert(allowedEmails)
    .values({ email })
    .onConflictDoNothing()
    .returning();
  return { email, alreadyListed: !inserted };
}

export async function removeAllowedEmail(email: string) {
  const admin = await requireAdmin();
  if (email.trim().toLowerCase() === admin.email?.trim().toLowerCase()) {
    throw new Error("You can’t remove your own access.");
  }
  await db.delete(allowedEmails).where(eq(allowedEmails.email, email));
  // Nothing cascades to verification_token. src/auth.ts already rejects a
  // pending link on redeem; this keeps none stored for a revoked address.
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email.trim().toLowerCase()));
}
