import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { SITE_SETTINGS_ID, siteSettings } from "@/db/schema";
import { CENTER_ADDRESS, CENTER_EMAIL, CENTER_PHONE, phoneHref } from "@/lib/center";
import { ZEFFY_DONATION_EMBED_URL } from "@/lib/donate";
import { failSoft } from "@/lib/fail-soft";
import { wallClockNow } from "@/lib/format";

export const getSiteSettings = cache(async function getSiteSettings() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SITE_SETTINGS_ID));
  return row ?? null;
});

export async function getAboutVideoUrls() {
  try {
    const settings = await getSiteSettings();
    return settings?.aboutVideoUrls ?? [];
  } catch {
    return [];
  }
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

export type CenterContact = {
  address: string;
  phone: string;
  phoneHref: string;
  email: string;
};

export const getCenterContact = cache(async function getCenterContact(): Promise<CenterContact> {
  const settings = await failSoft(getSiteSettings(), null);
  const phone = settings?.phone ?? CENTER_PHONE;
  return {
    address: settings?.address ?? CENTER_ADDRESS,
    phone,
    phoneHref: phoneHref(phone),
    email: settings?.email ?? CENTER_EMAIL,
  };
});

const DEFAULT_CHECK_PAYEE = "SEJSCC";

export type DonationDetails = {
  zelleRecipient: string | null;
  checkPayee: string;
  checkAddress: string;
  donateFormUrl: string;
};

export const getDonationDetails = cache(async function getDonationDetails(): Promise<DonationDetails> {
  const settings = await failSoft(getSiteSettings(), null);
  return {
    zelleRecipient: settings?.zelleRecipient ?? null,
    checkPayee: settings?.checkPayee ?? DEFAULT_CHECK_PAYEE,
    checkAddress: settings?.checkAddress ?? settings?.address ?? CENTER_ADDRESS,
    donateFormUrl: settings?.donateFormUrl ?? ZEFFY_DONATION_EMBED_URL,
  };
});

export type Announcement = {
  text: string;
  textJa: string | null;
  url: string | null;
};

export const getAnnouncement = cache(async function getAnnouncement(): Promise<Announcement | null> {
  const settings = await failSoft(getSiteSettings(), null);
  if (!settings?.announcementText) return null;
  if (settings.announcementUntil && settings.announcementUntil < wallClockNow()) {
    return null;
  }
  return {
    text: settings.announcementText,
    textJa: settings.announcementTextJa,
    url: settings.announcementUrl,
  };
});
