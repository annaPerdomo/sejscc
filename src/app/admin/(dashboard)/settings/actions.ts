"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { SITE_SETTINGS_ID, siteSettings } from "@/db/schema";
import { AdminError, runAction, type ActionResult } from "@/lib/action-result";
import { requireAdmin, requireUser, revalidateSite } from "@/lib/admin";
import { CENTER_ADDRESS, CENTER_EMAIL, CENTER_PHONE } from "@/lib/center";
import { normalizeContactEmail, wallClockNow } from "@/lib/format";
import { japaneseFollowingEnglish, type JapaneseUpdate } from "@/lib/japanese-drafts";
import { normalizeContactLinkUrl, tooLongMessage } from "@/lib/volunteer-fields";
import { youtubeVideoId } from "@/lib/video";

async function upsertSiteSettings(set: Partial<typeof siteSettings.$inferInsert>) {
  await db
    .insert(siteSettings)
    .values({ id: SITE_SETTINGS_ID, ...set })
    .onConflictDoUpdate({ target: siteSettings.id, set });
}

export async function updateAccessRequestEmail(raw: string): Promise<ActionResult<string | null>> {
  return runAction(async () => {
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
  });
}

const MAX_ABOUT_VIDEOS = 6;

export async function updateAboutVideoUrls(raw: string): Promise<ActionResult<string[]>> {
  return runAction(async () => {
    await requireUser();
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > MAX_ABOUT_VIDEOS) {
      throw new AdminError(`You can list at most ${MAX_ABOUT_VIDEOS} videos.`);
    }

    const urls = lines.map((line) => {
      const videoId = youtubeVideoId(line);
      if (!videoId) {
        throw new AdminError(
          `"${line}" doesn't look like a YouTube link. Copy the address from the video's page, which looks like https://www.youtube.com/watch?v=abc123.`
        );
      }
      return `https://www.youtube.com/watch?v=${videoId}`;
    });

    await db
      .insert(siteSettings)
      .values({ id: SITE_SETTINGS_ID, aboutVideoUrls: urls })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { aboutVideoUrls: urls },
      });
    revalidateSite();
    return urls;
  });
}

export type ContactDetailsInput = {
  address: string;
  phone: string;
  email: string;
};

function checkedAddress(raw: string): string | null {
  const address = raw.trim();
  if (!address) throw new AdminError("Please enter the street address.");
  if (address.length > 200) throw new AdminError(tooLongMessage("address", 200));
  return address === CENTER_ADDRESS ? null : address;
}

function checkedPhone(raw: string): string | null {
  const phone = raw.trim();
  if (!phone) throw new AdminError("Please enter the phone number.");
  if (phone.length > 40) throw new AdminError(tooLongMessage("phone number", 40));
  return phone === CENTER_PHONE ? null : phone;
}

function checkedEmail(raw: string): string | null {
  const email = normalizeContactEmail(raw);
  if (!email) throw new AdminError("Please enter the email address.");
  return email === CENTER_EMAIL ? null : email;
}

const CONTACT_CHECKS = { address: checkedAddress, phone: checkedPhone, email: checkedEmail };

export async function updateContactDetails(
  input: ContactDetailsInput
): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    await upsertSiteSettings({
      address: checkedAddress(input.address),
      phone: checkedPhone(input.phone),
      email: checkedEmail(input.email),
    });
    revalidateSite();
  });
}

export async function updateContactField(
  field: keyof ContactDetailsInput,
  value: string
): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    if (!Object.hasOwn(CONTACT_CHECKS, field)) throw new AdminError("That contact detail doesn't exist.");
    await upsertSiteSettings({ [field]: CONTACT_CHECKS[field](value) });
    revalidateSite();
  });
}

export type DonationDetailsInput = {
  zelleRecipient: string;
  checkPayee: string;
  checkAddress: string;
  donateFormUrl: string;
};

const DONATE_FORM_URL_MAX = 500;

function normalizeDonateFormUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > DONATE_FORM_URL_MAX) {
    throw new AdminError("The donation form link is too long.");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AdminError("The donation form link has to be a Zeffy address.");
  }
  const isZeffyHost =
    url.hostname === "zeffy.com" || url.hostname.endsWith(".zeffy.com");
  if (url.protocol !== "https:" || !isZeffyHost) {
    throw new AdminError("The donation form link has to be a Zeffy address.");
  }
  return url.href;
}

const DONATION_TEXT_LIMITS = {
  zelleRecipient: { noun: "Zelle name or email", max: 120 },
  checkPayee: { noun: "checks payable to name", max: 120 },
  checkAddress: { noun: "mailing address", max: 200 },
};

function checkedDonationText(field: keyof typeof DONATION_TEXT_LIMITS, raw: string): string | null {
  const { noun, max } = DONATION_TEXT_LIMITS[field];
  const value = raw.trim();
  if (value.length > max) throw new AdminError(tooLongMessage(noun, max));
  return value || null;
}

export async function updateDonationDetails(
  input: DonationDetailsInput
): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    await upsertSiteSettings({
      zelleRecipient: checkedDonationText("zelleRecipient", input.zelleRecipient),
      checkPayee: checkedDonationText("checkPayee", input.checkPayee),
      checkAddress: checkedDonationText("checkAddress", input.checkAddress),
      donateFormUrl: normalizeDonateFormUrl(input.donateFormUrl),
    });
    revalidateSite();
  });
}

export async function updateDonationField(
  field: keyof typeof DONATION_TEXT_LIMITS,
  value: string
): Promise<ActionResult> {
  return runAction(async () => {
    await requireUser();
    if (!Object.hasOwn(DONATION_TEXT_LIMITS, field)) throw new AdminError("That donation detail doesn't exist.");
    await upsertSiteSettings({ [field]: checkedDonationText(field, value) });
    revalidateSite();
  });
}

export type AnnouncementInput = {
  text: string;
  textJa: string;
  url: string;
  linkLabel: string;
  until: string;
};

const ANNOUNCEMENT_TEXT_MAX = 140;
const ANNOUNCEMENT_LINK_LABEL_MAX = 30;

function parseAnnouncementUntil(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new AdminError("The show-until date doesn't look right.");
  }
  // Matches the wall-clock storage convention in src/lib/format.ts: the
  // announcement is still live through 11:59pm Pacific on the chosen day.
  const until = new Date(`${trimmed}T23:59:59Z`);
  if (Number.isNaN(until.getTime())) {
    throw new AdminError("The show-until date doesn't look right.");
  }
  const today = wallClockNow().toISOString().slice(0, 10);
  if (trimmed < today) {
    throw new AdminError("That date has already passed. Pick today or later.");
  }
  return until;
}

export async function updateAnnouncement(
  input: AnnouncementInput
): Promise<ActionResult<{ textJa: string | null; japanese: JapaneseUpdate | null }>> {
  return runAction(async () => {
    await requireUser();

    const text = input.text.trim();
    if (!text) {
      await upsertSiteSettings({
        announcementText: null,
        announcementTextJa: null,
        announcementUrl: null,
        announcementLinkLabel: null,
        announcementUntil: null,
      });
      revalidateSite();
      return { textJa: null, japanese: null };
    }
    if (text.length > ANNOUNCEMENT_TEXT_MAX) {
      throw new AdminError(tooLongMessage("message", ANNOUNCEMENT_TEXT_MAX));
    }

    const typedJa = input.textJa.trim() || null;
    if (typedJa && typedJa.length > ANNOUNCEMENT_TEXT_MAX) {
      throw new AdminError(
        "The Japanese message can't be longer than 140 characters."
      );
    }
    const url = normalizeContactLinkUrl(input.url);
    const linkLabel = url ? (input.linkLabel ?? "").trim() || null : null;
    if (linkLabel && linkLabel.length > ANNOUNCEMENT_LINK_LABEL_MAX) {
      throw new AdminError(tooLongMessage("link text", ANNOUNCEMENT_LINK_LABEL_MAX));
    }
    const until = parseAnnouncementUntil(input.until);

    const [saved] = await db
      .select({
        english: siteSettings.announcementText,
        japanese: siteSettings.announcementTextJa,
      })
      .from(siteSettings)
      .where(eq(siteSettings.id, SITE_SETTINGS_ID));
    const { japanese: textJa, update } = await japaneseFollowingEnglish({
      english: text,
      japanese: typedJa,
      max: ANNOUNCEMENT_TEXT_MAX,
      saved: saved ?? { english: null, japanese: null },
    });

    await upsertSiteSettings({
      announcementText: text,
      announcementTextJa: textJa,
      announcementUrl: url,
      announcementLinkLabel: linkLabel,
      announcementUntil: until,
    });
    revalidateSite();
    return { textJa, japanese: update };
  });
}
