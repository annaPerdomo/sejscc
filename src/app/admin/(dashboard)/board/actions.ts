"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { VOLUNTEER_SECTION_ID, volunteerSection } from "@/db/schema";
import { requireUser, revalidateSite } from "@/lib/admin";
import { isUploadedFileUrl } from "@/lib/format";
import { checkedBlobImageUrl } from "@/lib/uploads";

export type VolunteerSectionInput = {
  title: string;
  titleJa: string;
  intro: string;
  introJa: string;
  photoAlt: string;
  photoAltJa: string;
  volunteersNote: string;
  volunteersNoteJa: string;
  contactNote: string;
  contactNoteJa: string;
  contactLinkLabel: string;
  contactLinkLabelJa: string;
  waysTitle: string;
  waysTitleJa: string;
  waysIntro: string;
  waysIntroJa: string;
  photoUrl: string | null;
};

const SHORT_MAX = 80;
const LINK_MAX = 40;
const LONG_MAX = 600;

function tooLong(label: string, max: number): never {
  throw new Error(
    `The ${label} is too long — please keep it under ${max} characters.`
  );
}

function required(label: string): never {
  throw new Error(`Please fill in the English ${label}.`);
}

function requiredField(en: string, ja: string, label: string, max: number) {
  const trimmedEn = en.trim();
  const trimmedJa = ja.trim();
  if (!trimmedEn) required(label);
  if (trimmedEn.length > max) tooLong(label, max);
  if (trimmedJa.length > max) tooLong(`Japanese ${label}`, max);
  return { en: trimmedEn, ja: trimmedJa || null };
}

export async function updateVolunteerSection(
  input: VolunteerSectionInput
): Promise<void> {
  await requireUser();

  const title = requiredField(input.title, input.titleJa, "heading", SHORT_MAX);
  const intro = requiredField(input.intro, input.introJa, "introduction", LONG_MAX);
  const volunteersNote = requiredField(
    input.volunteersNote,
    input.volunteersNoteJa,
    "note about volunteers",
    LONG_MAX
  );
  const waysTitle = requiredField(
    input.waysTitle,
    input.waysTitleJa,
    "ways to help heading",
    SHORT_MAX
  );
  const waysIntro = requiredField(
    input.waysIntro,
    input.waysIntroJa,
    "ways to help introduction",
    LONG_MAX
  );
  const contactNote = requiredField(
    input.contactNote,
    input.contactNoteJa,
    "contact sentence",
    LONG_MAX
  );
  const contactLinkLabel = requiredField(
    input.contactLinkLabel,
    input.contactLinkLabelJa,
    "contact link words",
    LINK_MAX
  );
  // Required even with no custom photo, since the bundled fallback still
  // needs alt text for visitors who can't see it.
  const photoAlt = requiredField(
    input.photoAlt,
    input.photoAltJa,
    "photo description",
    LONG_MAX
  );

  const photoUrl = checkedBlobImageUrl(input.photoUrl);

  const values = {
    title: title.en,
    titleJa: title.ja,
    intro: intro.en,
    introJa: intro.ja,
    photoUrl,
    photoAlt: photoAlt.en,
    photoAltJa: photoAlt.ja,
    volunteersNote: volunteersNote.en,
    volunteersNoteJa: volunteersNote.ja,
    contactNote: contactNote.en,
    contactNoteJa: contactNote.ja,
    contactLinkLabel: contactLinkLabel.en,
    contactLinkLabelJa: contactLinkLabel.ja,
    waysTitle: waysTitle.en,
    waysTitleJa: waysTitle.ja,
    waysIntro: waysIntro.en,
    waysIntroJa: waysIntro.ja,
  };

  const [existing] = await db
    .select({ photoUrl: volunteerSection.photoUrl })
    .from(volunteerSection)
    .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID));

  await db
    .insert(volunteerSection)
    .values({ id: VOLUNTEER_SECTION_ID, ...values })
    .onConflictDoUpdate({
      target: volunteerSection.id,
      set: values,
    });

  if (
    existing?.photoUrl &&
    existing.photoUrl !== photoUrl &&
    isUploadedFileUrl(existing.photoUrl)
  ) {
    try {
      await del(existing.photoUrl);
    } catch (error) {
      console.error("Failed to delete the previous board photo blob:", error);
    }
  }

  revalidateSite();
}
