import type { BoardMember, VolunteerSectionRow } from "@/db/schema";
import { isUploadedFileUrl } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

export function localized(en: string, ja: string | null | undefined, lang: Locale): string {
  return lang === "ja" && ja ? ja : en;
}

export function localizedOptional(
  en: string | null,
  ja: string | null | undefined,
  lang: Locale
): string | null {
  if (en === null) return lang === "ja" ? (ja ?? null) : null;
  return localized(en, ja, lang);
}

export type VolunteerSectionView = {
  title: string;
  intro: string;
  photo: { src: string; width: number; height: number } | null;
  photoAlt: string;
  volunteersNote: string;
  contactNote: string;
  contactLinkLabel: string;
  contactLinkUrl: string | null;
  members: {
    id: string;
    name: string;
    role: string | null;
    photoUrl: string | null;
    visible: boolean;
  }[];
};

// Landscape fallback frame used when the blob header read fails.
export const DEFAULT_PHOTO_SIZE = { width: 1200, height: 900 };

function checkedPhotoUrl(url: string | null): string | null {
  return url && isUploadedFileUrl(url) ? url : null;
}

export function toVolunteerSectionView(
  row: VolunteerSectionRow,
  members: BoardMember[],
  lang: Locale,
  photoSize: { width: number; height: number } | null
): VolunteerSectionView {
  const photoUrl = checkedPhotoUrl(row.photoUrl);
  return {
    title: localized(row.title, row.titleJa, lang),
    intro: localized(row.intro, row.introJa, lang),
    photo: photoUrl
      ? {
          src: photoUrl,
          width: photoSize?.width ?? DEFAULT_PHOTO_SIZE.width,
          height: photoSize?.height ?? DEFAULT_PHOTO_SIZE.height,
        }
      : null,
    photoAlt: localized(row.photoAlt, row.photoAltJa, lang),
    volunteersNote: localized(row.volunteersNote, row.volunteersNoteJa, lang),
    contactNote: localized(row.contactNote, row.contactNoteJa, lang),
    contactLinkLabel: localized(row.contactLinkLabel, row.contactLinkLabelJa, lang),
    contactLinkUrl: row.contactLinkUrl,
    members: members.map((member) => ({
      id: member.id,
      name: localized(member.name, member.nameJa, lang),
      role: localizedOptional(member.role, member.roleJa, lang),
      photoUrl: checkedPhotoUrl(member.photoUrl),
      visible: member.visible,
    })),
  };
}
