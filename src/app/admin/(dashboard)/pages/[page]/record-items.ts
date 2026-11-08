import type { PhotoSaveActions, PhotoSpot, PhotoTile } from "@/components/admin/inline-edit/photo-slot-tile";
import type { BoardMember, SchoolLevel, SchoolYearEvent, VolunteerSectionRow } from "@/db/schema";
import type { Group } from "@/lib/events";
import type { ActionResult } from "@/lib/action-result";
import type { Locale } from "@/lib/i18n";
import {
  LEVEL_DESCRIPTION_MAX,
  LEVEL_KANJI_MAX,
  LEVEL_NAME_MAX,
  LEVEL_POINT_MAX,
  LEVEL_SUMMARY_MAX,
} from "@/lib/school-level-limits";
import type { CenterContact } from "@/lib/site-settings";
import type { SiteTextKind } from "@/lib/site-text-fields";
import { LONG_MAX, MEMBER_TEXT_FIELDS, SECTION_TEXT_FIELDS } from "@/lib/volunteer-fields";
import {
  updateContactLinkLabel,
  updateMemberFields,
  updateMemberPhoto,
  updateSectionPhoto,
  updateSectionPhotoDescription,
  updateSectionText,
} from "../../board/actions";
import { updateEventTitle } from "../../events/actions";
import { updateGroupText } from "../../groups/actions";
import {
  updateSchoolLevelPhoto,
  updateSchoolLevelPoint,
  updateSchoolLevelText,
} from "../../levels/actions";
import { updateSchoolYearEventPhoto, updateSchoolYearEventText } from "../../school-year/actions";
import { updateContactField, updateDonationField } from "../../settings/actions";
import { boardPhoto } from "@/lib/photos";

export type PageRecords = {
  levels: SchoolLevel[];
  yearEvents: SchoolYearEvent[];
  groups: Group[];
  board: { section: VolunteerSectionRow; members: BoardMember[] } | null;
  contact: CenterContact | null;
  donation: {
    zelleRecipient: string | null;
    checkPayee: string | null;
    checkAddress: string | null;
    shownPayee: string;
    shownAddress: string;
  } | null;
  events: { id: string; title: string }[];
};

type RecordBase = {
  record: string;
  title: string;
};

export type RecordWords = RecordBase & {
  kind: "recordWords";
  textKind: SiteTextKind;
  max: number;
  /** One column that both languages show. */
  shared: boolean;
  required: (lang: Locale) => boolean;
  value: (lang: Locale) => string | null;
  /** What Undo puts back, when the value shown is a default rather than what's stored. */
  stored?: (lang: Locale) => string | null;
  placeholder?: string;
  save: (lang: Locale, value: string) => Promise<ActionResult>;
};

export type RecordPhoto = RecordBase & {
  kind: "recordPhoto";
  spot: PhotoSpot;
  actions: PhotoSaveActions;
  tile: PhotoTile;
};

export type RecordElsewhere = RecordBase & {
  kind: "recordElsewhere";
  description: string;
  href: string;
  action: string;
};

export type RecordItem = RecordWords | RecordPhoto | RecordElsewhere;

type WordsSpec = Omit<RecordWords, "kind" | "shared" | "required" | "value"> & { required: boolean };

function pairedWords(spec: WordsSpec, en: string | null, ja: string | null): RecordWords {
  return {
    ...spec,
    kind: "recordWords",
    shared: false,
    required: (lang) => spec.required && lang === "en",
    value: (lang) => (lang === "en" ? en : ja),
  };
}

function sharedWords(spec: WordsSpec, value: string | null): RecordWords {
  return { ...spec, kind: "recordWords", shared: true, required: () => spec.required, value: () => value };
}

function photoTile(record: string, src: string | null, alt: string, altJa: string | null): PhotoTile {
  const current = { src: src ?? "", alt, altJa: altJa ?? "" };
  return { slot: record, current, original: current, isChanged: true };
}

function levelItems(level: SchoolLevel): RecordItem[] {
  const id = level.id;
  const of = (part: string) => `level:${id}:${part}`;
  const text = (field: "name" | "summary" | "description") => (lang: Locale, value: string) =>
    updateSchoolLevelText({ id, field, lang, value });
  return [
    pairedWords(
      { record: of("name"), title: `Class name (${level.name})`, textKind: "heading", max: LEVEL_NAME_MAX, required: true, save: text("name") },
      level.name,
      level.nameJa
    ),
    pairedWords(
      { record: of("summary"), title: `Class summary (${level.name})`, textKind: "short", max: LEVEL_SUMMARY_MAX, required: true, save: text("summary") },
      level.summary,
      level.summaryJa
    ),
    pairedWords(
      { record: of("description"), title: `Class description (${level.name})`, textKind: "body", max: LEVEL_DESCRIPTION_MAX, required: true, save: text("description") },
      level.description,
      level.descriptionJa
    ),
    sharedWords(
      {
        record: of("kanji"),
        title: `Plaque kanji (${level.name})`,
        textKind: "short",
        max: LEVEL_KANJI_MAX,
        required: false,
        save: (lang, value) => updateSchoolLevelText({ id, field: "kanji", lang, value }),
      },
      level.kanji
    ),
    ...level.points.map((point, index) => ({
      ...pairedWords(
        {
          record: of(`points.${index}`),
          title: `Point ${index + 1} (${level.name})`,
          textKind: "short" as const,
          max: LEVEL_POINT_MAX,
          required: true,
          save: (lang: Locale, value: string) => updateSchoolLevelPoint({ id, index, lang, value }),
        },
        point,
        level.pointsJa[index] ?? null
      ),
      required: () => true,
    })),
    {
      kind: "recordPhoto",
      record: of("photo"),
      title: `Photo of ${level.name}`,
      spot: { title: `Photo of ${level.name}`, shape: "photo", framable: false, altOptional: false, uploadFolder: "site/levels" },
      actions: {
        replace: ({ url, alt, altJa }) => updateSchoolLevelPhoto({ id, url, alt, altJa }),
        updateDetails: ({ alt, altJa }) => updateSchoolLevelPhoto({ id, url: "unchanged", alt, altJa }),
      },
      tile: photoTile(of("photo"), level.photoUrl, level.photoAlt, level.photoAltJa),
    },
  ];
}

const YEAR_WORDS = [
  { field: "title", ja: "titleJa", label: "Event name", textKind: "heading", max: 80 },
  { field: "when", ja: "whenJa", label: "When", textKind: "short", max: 80 },
  { field: "label", ja: "labelJa", label: "Short label", textKind: "short", max: 40 },
  { field: "abbr", ja: "abbrJa", label: "Month", textKind: "short", max: 12 },
  { field: "gloss", ja: "glossJa", label: "What it means", textKind: "short", max: 80 },
  { field: "description", ja: "descriptionJa", label: "Description", textKind: "body", max: 600 },
] as const;

function yearEventItems(row: SchoolYearEvent): RecordItem[] {
  const of = (part: string) => `year:${row.key}:${part}`;
  return [
    ...YEAR_WORDS.map(({ field, ja, label, textKind, max }) =>
      pairedWords(
        {
          record: of(field),
          title: `${label} (${row.title})`,
          textKind,
          max,
          required: true,
          save: (lang, value) => updateSchoolYearEventText({ id: row.id, field, lang, value }),
        },
        row[field],
        row[ja]
      )
    ),
    sharedWords(
      {
        record: of("termJa"),
        title: `Japanese name (${row.title})`,
        textKind: "short",
        max: 40,
        required: true,
        save: (lang, value) => updateSchoolYearEventText({ id: row.id, field: "termJa", lang, value }),
      },
      row.termJa
    ),
    {
      kind: "recordPhoto",
      record: of("photo"),
      title: `Photo of ${row.title}`,
      spot: { title: `Photo of ${row.title}`, shape: "photo", framable: false, altOptional: false, uploadFolder: "site/school-year" },
      actions: {
        replace: ({ url, alt, altJa }) => updateSchoolYearEventPhoto({ id: row.id, url, alt, altJa }),
        updateDetails: ({ alt, altJa }) => updateSchoolYearEventPhoto({ id: row.id, url: "unchanged", alt, altJa }),
      },
      tile: photoTile(of("photo"), row.photoUrl, row.photoAlt, row.photoAltJa),
    },
  ];
}

function groupItems(row: Group): RecordItem[] {
  const of = (part: string) => `group:${row.id}:${part}`;
  return [
    sharedWords(
      { record: of("name"), title: `Group name (${row.name})`, textKind: "heading", max: 100, required: true, save: (_lang, value) => updateGroupText(row.id, "name", value) },
      row.name
    ),
    sharedWords(
      { record: of("nameJa"), title: `Japanese name (${row.name})`, textKind: "short", max: 60, required: false, save: (_lang, value) => updateGroupText(row.id, "nameJa", value) },
      row.nameJa
    ),
    sharedWords(
      {
        record: of("meetingSchedule"),
        title: `When it meets (${row.name})`,
        textKind: "short",
        max: 100,
        required: false,
        placeholder: "For example: Saturdays 1:00 pm",
        save: (_lang, value) => updateGroupText(row.id, "meetingSchedule", value),
      },
      row.meetingSchedule
    ),
    sharedWords(
      { record: of("description"), title: `Description (${row.name})`, textKind: "body", max: 500, required: false, save: (_lang, value) => updateGroupText(row.id, "description", value) },
      row.description
    ),
    sharedWords(
      { record: of("contactEmail"), title: `Contact email (${row.name})`, textKind: "short", max: 200, required: false, save: (_lang, value) => updateGroupText(row.id, "contactEmail", value) },
      row.contactEmail
    ),
  ];
}

function boardItems(section: VolunteerSectionRow, members: BoardMember[]): RecordItem[] {
  const sectionWords = (["title", "intro", "volunteersNote", "contactNote"] as const).map((field) => {
    const spec = SECTION_TEXT_FIELDS[field];
    return pairedWords(
      {
        record: `board:${field}`,
        title: `Board section ${spec.label}`,
        textKind: spec.max === LONG_MAX ? "body" : "heading",
        max: spec.max,
        required: true,
        save: (lang, value) => updateSectionText(field, lang, value),
      },
      section[spec.en],
      section[spec.ja]
    );
  });
  const linkSpec = SECTION_TEXT_FIELDS.contactLinkLabel;
  const memberItems = members.flatMap((member): RecordItem[] => {
    const nameIn = (lang: Locale) => (lang === "en" ? member.name : member.nameJa ?? "");
    const roleIn = (lang: Locale) => (lang === "en" ? member.role ?? "" : member.roleJa ?? "");
    return [
      pairedWords(
        {
          record: `member:${member.id}:name`,
          title: `Board member's ${MEMBER_TEXT_FIELDS.name.label} (${member.name})`,
          textKind: "short",
          max: MEMBER_TEXT_FIELDS.name.max,
          required: true,
          save: (lang, name) => updateMemberFields(member.id, lang, { name, role: roleIn(lang) }),
        },
        member.name,
        member.nameJa
      ),
      pairedWords(
        {
          record: `member:${member.id}:role`,
          title: `Board member's ${MEMBER_TEXT_FIELDS.role.label} (${member.name})`,
          textKind: "short",
          max: MEMBER_TEXT_FIELDS.role.max,
          required: false,
          save: (lang, role) => updateMemberFields(member.id, lang, { name: nameIn(lang), role }),
        },
        member.role,
        member.roleJa
      ),
      {
        kind: "recordPhoto",
        record: `member:${member.id}:photo`,
        title: `Photo of ${member.name}`,
        spot: {
          title: `Photo of ${member.name}`,
          shape: "square",
          framable: false,
          altOptional: true,
          describable: false,
          uploadFolder: "site/board",
        },
        actions: {
          replace: ({ url }) => updateMemberPhoto(member.id, url),
        },
        tile: photoTile(`member:${member.id}:photo`, member.photoUrl, "", null),
      },
    ];
  });
  return [
    ...sectionWords,
    pairedWords(
      {
        record: "board:contactLinkLabel",
        title: `Board section ${linkSpec.label}`,
        textKind: "short",
        max: linkSpec.max,
        required: true,
        save: (lang, label) => updateContactLinkLabel(lang, label),
      },
      section.contactLinkLabel,
      section.contactLinkLabelJa
    ),
    {
      kind: "recordPhoto",
      record: "board:photo",
      title: "Board photo",
      spot: { title: "Board photo", shape: "photo", framable: false, altOptional: false, uploadFolder: "site/board" },
      actions: {
        replace: ({ url, alt, altJa }) => updateSectionPhoto({ photoUrl: url, photoAlt: alt, photoAltJa: altJa }),
        updateDetails: ({ alt, altJa }) => updateSectionPhotoDescription(alt, altJa),
      },
      tile: photoTile("board:photo", section.photoUrl ?? boardPhoto.src, section.photoAlt, section.photoAltJa),
    },
    ...memberItems,
  ];
}

function contactItems(contact: CenterContact): RecordItem[] {
  const fields = [
    { field: "address", title: "The center's address", max: 200 },
    { field: "phone", title: "The center's phone number", max: 40 },
    { field: "email", title: "The center's email address", max: 200 },
  ] as const;
  return fields.map(({ field, title, max }) =>
    sharedWords(
      {
        record: `contact:${field}`,
        title,
        textKind: "short",
        max,
        required: true,
        save: (_lang, value) => updateContactField(field, value),
      },
      contact[field]
    )
  );
}

function donationItems(donation: NonNullable<PageRecords["donation"]>): RecordItem[] {
  return [
    sharedWords(
      {
        record: "donation:zelleRecipient",
        title: "Who receives Zelle payments",
        textKind: "short",
        max: 120,
        required: false,
        placeholder: "A name or email address registered with Zelle",
        save: (_lang, value) => updateDonationField("zelleRecipient", value),
      },
      donation.zelleRecipient
    ),
    {
      ...sharedWords(
        {
          record: "donation:checkPayee",
          title: "Who checks are made out to",
          textKind: "short",
          max: 120,
          required: false,
          save: (_lang, value) => updateDonationField("checkPayee", value),
        },
        donation.shownPayee
      ),
      stored: () => donation.checkPayee,
    },
    {
      ...sharedWords(
        {
          record: "donation:checkAddress",
          title: "Where to mail checks",
          textKind: "short",
          max: 200,
          required: false,
          save: (_lang, value) => updateDonationField("checkAddress", value),
        },
        donation.shownAddress
      ),
      stored: () => donation.checkAddress,
    },
  ];
}

function eventItems(event: { id: string; title: string }): RecordItem[] {
  return [
    sharedWords(
      { record: `event:${event.id}:title`, title: `Event title (${event.title})`, textKind: "heading", max: 200, required: true, save: (_lang, title) => updateEventTitle(event.id, title) },
      event.title
    ),
    {
      kind: "recordElsewhere",
      record: `event:${event.id}:details`,
      title: event.title,
      description:
        "The date, time, description and flyer of an event are changed on the event's own page, where repeating dates and flyers can be set up properly.",
      href: `/admin/events/${event.id}`,
      action: "Change this event",
    },
  ];
}

const TOP_BANNER: RecordElsewhere = {
  kind: "recordElsewhere",
  record: "banner",
  title: "Top banner",
  description:
    "The bar across the top of every page shows the next event, or a message you write instead. It has its own page, since it's the same on every page of the website.",
  href: "/admin/announcement",
  action: "Change the top banner",
};

export function recordItems(records: PageRecords): RecordItem[] {
  return [
    TOP_BANNER,
    ...records.levels.flatMap(levelItems),
    ...records.yearEvents.flatMap(yearEventItems),
    ...records.groups.flatMap(groupItems),
    ...(records.board ? boardItems(records.board.section, records.board.members) : []),
    ...(records.contact ? contactItems(records.contact) : []),
    ...(records.donation ? donationItems(records.donation) : []),
    ...records.events.flatMap(eventItems),
  ];
}
