import { LONG_MAX, SHORT_MAX } from "@/lib/volunteer-fields";
import { readPath } from "@/lib/object-path";

export type SiteTextKind = "heading" | "body" | "short";

export type SiteTextField = {
  path: string;
  label: string;
  kind: SiteTextKind;
  max: number;
};

export type SiteTextSection = {
  id: string;
  fields: SiteTextField[];
};

export type SiteTextPage = {
  id: "home" | "school" | "donate" | "groups" | "events";
  href: string;
  sections: SiteTextSection[];
};

const SHORT_FIELD_MAX = 120;

const KIND_MAX: Record<SiteTextKind, number> = {
  heading: SHORT_MAX,
  short: SHORT_FIELD_MAX,
  body: LONG_MAX,
};

function field(path: string, label: string, kind: SiteTextKind): SiteTextField {
  return { path, label, kind, max: KIND_MAX[kind] };
}

function section(id: string, fields: SiteTextField[]): SiteTextSection {
  return { id, fields };
}

function displayIndex(n: number): string {
  return `${n + 1}`;
}

const TUITION_PLAN_POINT_COUNTS = [4, 4, 3];
const SCHOOL_HISTORY_PARAGRAPH_COUNT = 4;
const SCHOOL_FACTS_COUNT = 4;
const DONATE_REASONS_COUNT = 4;

export const SITE_TEXT_PAGES: SiteTextPage[] = [
  {
    id: "home",
    href: "/",
    sections: [
      section("home-top", [
        field("home.eventsHero.headingLine1", "Heading, first line", "heading"),
        field("home.eventsHero.headingLine2", "Heading, second line", "heading"),
      ]),
      section("home-japanese-school", [
        field("home.japaneseSchool.headingLine1", "Heading, first line", "heading"),
        field("home.japaneseSchool.headingLine2", "Heading, second line", "heading"),
        field("home.japaneseSchool.subheading", "Subheading", "short"),
        field("home.japaneseSchool.body", "Paragraph", "body"),
        field("home.japaneseSchool.classesFacts", "Class days and times", "short"),
      ]),
      section("home-sports-clubs", [
        field("home.sportsClubs.headingLine1", "Heading, first line", "heading"),
        field("home.sportsClubs.headingLine2", "Heading, second line", "heading"),
        field("home.sportsClubs.body", "Paragraph", "body"),
      ]),
      section("home-history", [
        field("home.history.headingLine1", "Heading, first line", "heading"),
        field("home.history.headingLine2", "Heading, second line", "heading"),
        field("home.history.body", "Paragraph", "body"),
        field("home.history.missionText", "Mission statement", "body"),
      ]),
      section("home-connect", [
        field("home.connectTitle", "Heading", "heading"),
        field("home.connectText", "Paragraph", "body"),
      ]),
    ],
  },
  {
    id: "school",
    href: "/school",
    sections: [
      section("school-top", [
        field("school.lede", "Opening sentence", "body"),
        ...Array.from({ length: SCHOOL_FACTS_COUNT }, (_, i) => [
          field(`school.facts.${i}.value`, `Fact ${displayIndex(i)}`, "short"),
          field(`school.facts.${i}.note`, `Fact ${displayIndex(i)}, small print`, "short"),
        ]).flat(),
      ]),
      section("school-classes", [
        field("school.classes.lede", "Opening sentence", "body"),
      ]),
      section("school-tuition", [
        field("school.tuition.lede", "Opening sentence", "body"),
        field("school.tuition.note", "Note under the plans", "body"),
        ...TUITION_PLAN_POINT_COUNTS.flatMap((pointCount, i) => [
          field(`school.tuition.plans.${i}.name`, `Plan ${displayIndex(i)} name`, "short"),
          field(`school.tuition.plans.${i}.badge`, `Plan ${displayIndex(i)} badge`, "short"),
          field(`school.tuition.plans.${i}.meta`, `Plan ${displayIndex(i)} schedule line`, "short"),
          field(`school.tuition.plans.${i}.price`, `Plan ${displayIndex(i)} price`, "short"),
          field(`school.tuition.plans.${i}.priceNote`, `Plan ${displayIndex(i)} price note`, "short"),
          field(`school.tuition.plans.${i}.cta`, `Plan ${displayIndex(i)} button`, "short"),
          ...Array.from({ length: pointCount }, (_, m) =>
            field(
              `school.tuition.plans.${i}.points.${m}`,
              `Plan ${displayIndex(i)}, point ${displayIndex(m)}`,
              "short"
            )
          ),
        ]),
      ]),
      section("school-history", [
        ...Array.from({ length: SCHOOL_HISTORY_PARAGRAPH_COUNT }, (_, i) =>
          field(`school.history.body.${i}`, `Paragraph ${displayIndex(i)}`, "body")
        ),
        field("school.history.mission", "Mission statement", "body"),
      ]),
      section("school-join", [
        field("school.join.leadBefore", "Opening sentence", "body"),
        field("school.join.note", "Note", "short"),
      ]),
    ],
  },
  {
    id: "donate",
    href: "/payments",
    sections: [
      section("donate-top", [
        field("payments.lede", "Opening sentence", "short"),
        field("payments.donateIntro", "Paragraph", "body"),
      ]),
      section("donate-reasons", [
        field("payments.impactTitle", "Heading", "heading"),
        ...Array.from({ length: DONATE_REASONS_COUNT }, (_, i) => [
          field(`payments.donateReasons.${i}.title`, `Reason ${displayIndex(i)}`, "short"),
          field(`payments.donateReasons.${i}.text`, `Reason ${displayIndex(i)}, details`, "body"),
        ]).flat(),
      ]),
      section("donate-mosaic", [
        field("payments.mosaicTitle", "Heading", "heading"),
        field("payments.mosaicText", "Paragraph", "body"),
      ]),
      section("donate-other", [
        field("payments.otherText", "Paragraph", "body"),
        field("payments.zelleText", "Zelle paragraph", "body"),
        field("payments.zelleMemo", "Zelle memo note", "body"),
        field("payments.checkMemo", "Check memo note", "body"),
        field("payments.questionsBefore", "Closing sentence", "body"),
      ]),
    ],
  },
  {
    id: "groups",
    href: "/groups",
    sections: [
      section("groups-top", [field("groups.lede", "Opening sentence", "body")]),
    ],
  },
  {
    id: "events",
    href: "/events",
    sections: [
      section("events-top", [
        field("events.titleLine1", "Heading", "heading"),
        field("events.lede", "Opening sentence", "body"),
      ]),
    ],
  },
];

const FIELDS_BY_PATH = new Map<string, SiteTextField>(
  SITE_TEXT_PAGES.flatMap((page) =>
    page.sections.flatMap((pageSection) =>
      pageSection.fields.map((f) => [f.path, f] as const)
    )
  )
);

export function siteTextField(path: string): SiteTextField | undefined {
  return FIELDS_BY_PATH.get(path);
}

export function assertSiteTextRegistry(en: unknown): void {
  const badPaths = [...FIELDS_BY_PATH.keys()].filter(
    (path) => typeof readPath(en, path) !== "string"
  );
  if (badPaths.length > 0) {
    throw new Error(
      `The words-on-the-site registry has paths that don't resolve to a string in en.json: ${badPaths.join(", ")}`
    );
  }
}
