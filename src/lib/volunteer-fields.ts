import type { SectionTextField } from "@/components/volunteer-section";
import type { BoardMember, VolunteerRole, VolunteerSectionRow } from "@/db/schema";
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

export type MemberTextField = "name" | "role";
export type RoleTextField = "title" | "description" | "commitment";

const ROLE_DESCRIPTION_MAX = 400;

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

export const ROLE_TEXT_FIELDS: Record<RoleTextField, TextFieldSpec<RoleTextField>> = {
  title: { en: "title", ja: "titleJa", label: "title", max: SHORT_MAX, required: true },
  description: {
    en: "description",
    ja: "descriptionJa",
    label: "description",
    max: ROLE_DESCRIPTION_MAX,
    required: true,
  },
  commitment: {
    en: "commitment",
    ja: "commitmentJa",
    label: "commitment",
    max: 60,
    required: false,
  },
};

const MEMBER_TEXT_FIELD_NAMES = Object.keys(MEMBER_TEXT_FIELDS) as MemberTextField[];
const ROLE_TEXT_FIELD_NAMES = Object.keys(ROLE_TEXT_FIELDS) as RoleTextField[];

export function isMemberTextField(field: string): field is MemberTextField {
  return (MEMBER_TEXT_FIELD_NAMES as string[]).includes(field);
}

export function isRoleTextField(field: string): field is RoleTextField {
  return (ROLE_TEXT_FIELD_NAMES as string[]).includes(field);
}

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

export function englishRoleValue(row: VolunteerRole, field: RoleTextField): string {
  return row[ROLE_TEXT_FIELDS[field].en] ?? "";
}

export function japaneseRoleValue(row: VolunteerRole, field: RoleTextField): string {
  return row[ROLE_TEXT_FIELDS[field].ja] ?? "";
}

export function withEnglishRoleValue(
  row: VolunteerRole,
  field: RoleTextField,
  value: string | null
): VolunteerRole {
  switch (field) {
    case "title":
      return { ...row, title: value ?? "" };
    case "description":
      return { ...row, description: value ?? "" };
    case "commitment":
      return { ...row, commitment: value };
  }
}

export function withJapaneseRoleValue(
  row: VolunteerRole,
  field: RoleTextField,
  value: string | null
): VolunteerRole {
  switch (field) {
    case "title":
      return { ...row, titleJa: value };
    case "description":
      return { ...row, descriptionJa: value };
    case "commitment":
      return { ...row, commitmentJa: value };
  }
}

export type RoleTextPatch = Partial<Record<RoleTextField | `${RoleTextField}Ja`, string | null>>;

export function roleTextPatch(
  field: RoleTextField,
  lang: Locale,
  value: string | null
): RoleTextPatch {
  const column = lang === "en" ? ROLE_TEXT_FIELDS[field].en : ROLE_TEXT_FIELDS[field].ja;
  return { [column]: value };
}

export function textFieldValue(
  isRequiredField: boolean,
  lang: Locale,
  trimmed: string
): string | null {
  return lang === "en" && isRequiredField ? trimmed : trimmed || null;
}
