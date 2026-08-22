"use server";

import { db } from "@/db";
import { SITE_SETTINGS_ID, siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { normalizeContactEmail } from "@/lib/format";

export async function updateAccessRequestEmail(raw: string) {
  await requireAdmin();
  const email = normalizeContactEmail(raw);
  await db
    .insert(siteSettings)
    .values({ id: SITE_SETTINGS_ID, accessRequestEmail: email })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { accessRequestEmail: email },
    });
  return email;
}
