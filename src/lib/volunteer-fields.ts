import type { SectionTextField } from "@/components/volunteer-section";
import type { VolunteerSectionRow } from "@/db/schema";

export const SHORT_MAX = 80;
export const LINK_MAX = 40;
export const LONG_MAX = 600;

export const SECTION_TEXT_FIELDS: Record<
  SectionTextField,
  { en: SectionTextField; ja: `${SectionTextField}Ja`; label: string; max: number }
> = {
  title: { en: "title", ja: "titleJa", label: "heading", max: SHORT_MAX },
  intro: { en: "intro", ja: "introJa", label: "introduction", max: LONG_MAX },
  volunteersNote: {
    en: "volunteersNote",
    ja: "volunteersNoteJa",
    label: "note about volunteers",
    max: LONG_MAX,
  },
  contactNote: {
    en: "contactNote",
    ja: "contactNoteJa",
    label: "contact sentence",
    max: LONG_MAX,
  },
  contactLinkLabel: {
    en: "contactLinkLabel",
    ja: "contactLinkLabelJa",
    label: "contact link words",
    max: LINK_MAX,
  },
  waysTitle: {
    en: "waysTitle",
    ja: "waysTitleJa",
    label: "ways to help heading",
    max: SHORT_MAX,
  },
  waysIntro: {
    en: "waysIntro",
    ja: "waysIntroJa",
    label: "ways to help introduction",
    max: LONG_MAX,
  },
};

const SECTION_TEXT_FIELD_NAMES = Object.keys(SECTION_TEXT_FIELDS) as SectionTextField[];

export function isSectionTextField(field: string): field is SectionTextField {
  return (SECTION_TEXT_FIELD_NAMES as string[]).includes(field);
}

export function requiredMessage(noun: string): string {
  return `Please fill in the English ${noun}.`;
}

export function tooLongMessage(noun: string, max: number): string {
  return `The ${noun} is too long — please keep it under ${max} characters.`;
}

export function englishSectionValue(
  row: VolunteerSectionRow,
  field: SectionTextField
): string {
  return row[SECTION_TEXT_FIELDS[field].en];
}

export function japaneseSectionValue(
  row: VolunteerSectionRow,
  field: SectionTextField
): string {
  return row[SECTION_TEXT_FIELDS[field].ja] ?? "";
}

export function withEnglishSectionValue(
  row: VolunteerSectionRow,
  field: SectionTextField,
  value: string
): VolunteerSectionRow {
  return { ...row, [SECTION_TEXT_FIELDS[field].en]: value } as VolunteerSectionRow;
}

export function withJapaneseSectionValue(
  row: VolunteerSectionRow,
  field: SectionTextField,
  value: string | null
): VolunteerSectionRow {
  return { ...row, [SECTION_TEXT_FIELDS[field].ja]: value } as VolunteerSectionRow;
}

export type SectionTextPatch = Partial<Record<SectionTextField | `${SectionTextField}Ja`, string | null>>;

export function sectionTextPatch(
  field: SectionTextField,
  lang: "en" | "ja",
  value: string | null
): SectionTextPatch {
  const column =
    lang === "en" ? SECTION_TEXT_FIELDS[field].en : SECTION_TEXT_FIELDS[field].ja;
  return { [column]: value };
}
