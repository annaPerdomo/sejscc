import { eq } from "drizzle-orm";
import { db } from "@/db";
import { SITE_SETTINGS_ID, siteSettings } from "@/db/schema";

export async function getSiteSettings() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SITE_SETTINGS_ID));
  return row ?? null;
}

// A database hiccup must drop the contact line, not break the login page.
export async function getAccessRequestEmail() {
  try {
    const settings = await getSiteSettings();
    return settings?.accessRequestEmail ?? null;
  } catch {
    return null;
  }
}
