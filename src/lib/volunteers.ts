import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { VOLUNTEER_SECTION_ID, boardMembers, volunteerSection } from "@/db/schema";
import { failSoft } from "@/lib/fail-soft";
import type { Locale } from "@/lib/i18n";
import { getImageSize } from "@/lib/image-size";
import { toVolunteerSectionView, type VolunteerSectionView } from "@/lib/volunteers-view";

export async function getVolunteerSection(lang: Locale): Promise<VolunteerSectionView | null> {
  const [sections, members] = await Promise.all([
    failSoft(
      db
        .select()
        .from(volunteerSection)
        .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID)),
      []
    ),
    failSoft(
      db
        .select()
        .from(boardMembers)
        .where(eq(boardMembers.visible, true))
        .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.createdAt)),
      []
    ),
  ]);

  const [section] = sections;
  if (!section) return null;

  const photoSize = section.photoUrl ? await getImageSize(section.photoUrl) : null;
  return toVolunteerSectionView(section, members, lang, photoSize);
}
