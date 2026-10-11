"use server";

import { eq } from "drizzle-orm";
import { unstable_update } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/admin";

export async function updateProfileName(name: string): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser();
    const trimmed = name.trim();
    if (!trimmed) throw new AdminError("Please enter your name.");
    if (trimmed.length > 100) {
      throw new AdminError("That name is too long. Please use 100 characters or fewer.");
    }
    await db.update(users).set({ name: trimmed }).where(eq(users.id, user.id));
    await unstable_update({ user: { name: trimmed } });
  });
}
