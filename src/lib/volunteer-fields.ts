import type { SectionTextField } from "@/components/volunteer-section";
import type { BoardMember, VolunteerSectionRow } from "@/db/schema";
import type { Locale } from "@/lib/i18n";

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

export type MemberTextField = "name" | "role";

type TextFieldSpec<TField extends string> = {
  en: TField;
  ja: `${TField}Ja`;
  label: string;
  max: number;
  required: boolean;
};

export const MEMBER_TEXT_FIELDS: Record<MemberTextField, TextFieldSpec<MemberTextField>> = {
  name: { en: "name", ja: "nameJa", label: "name", max: SHORT_MAX, required: true },
  role: { en: "role", ja: "roleJa", label: "title", max: 60, required: false },
};

export function englishMemberValue(row: BoardMember, field: MemberTextField): string {
  return row[MEMBER_TEXT_FIELDS[field].en] ?? "";
}

export function japaneseMemberValue(row: BoardMember, field: MemberTextField): string {
  return row[MEMBER_TEXT_FIELDS[field].ja] ?? "";
}

export function withEnglishMemberValue(
  row: BoardMember,
  field: MemberTextField,
  value: string | null
): BoardMember {
  switch (field) {
    case "name":
      return { ...row, name: value ?? "" };
    case "role":
      return { ...row, role: value };
  }
}

export function withJapaneseMemberValue(
  row: BoardMember,
  field: MemberTextField,
  value: string | null
): BoardMember {
  switch (field) {
    case "name":
      return { ...row, nameJa: value };
    case "role":
      return { ...row, roleJa: value };
  }
}

export type MemberTextPatch = Partial<Record<MemberTextField | `${MemberTextField}Ja`, string | null>>;

export function memberTextPatch(
  field: MemberTextField,
  lang: Locale,
  value: string | null
): MemberTextPatch {
  const column = lang === "en" ? MEMBER_TEXT_FIELDS[field].en : MEMBER_TEXT_FIELDS[field].ja;
  return { [column]: value };
}

export function textFieldValue(
  isRequiredField: boolean,
  lang: Locale,
  trimmed: string
): string | null {
  return lang === "en" && isRequiredField ? trimmed : trimmed || null;
}

export const CONTACT_LINK_URL_MAX = 500;

export const CONTACT_LINK_URL_MESSAGE =
  "Please enter a web address starting with https://, an email address, or leave this empty to send visitors to the Contact section.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactLinkUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length > CONTACT_LINK_URL_MAX) {
    throw new Error(tooLongMessage("link address", CONTACT_LINK_URL_MAX));
  }

  const email = trimmed.replace(/^mailto:/i, "");
  if (EMAIL_PATTERN.test(email)) return `mailto:${email}`;

  const withScheme = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(CONTACT_LINK_URL_MESSAGE);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(CONTACT_LINK_URL_MESSAGE);
  }
  return url.href;
}

export function contactLinkUrlForEditing(stored: string | null): string {
  return stored?.replace(/^mailto:/i, "") ?? "";
}
