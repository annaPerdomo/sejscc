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
const SCHOOL_LEDE_PARAGRAPH_COUNT = 3;
const SCHOOL_HISTORY_PARAGRAPH_COUNT = 4;
const SCHOOL_FACTS_COUNT = 4;
const DONATE_REASONS_COUNT = 4;

export const SITE_TEXT_PAGES: SiteTextPage[] = [
  {
    id: "home",
    href: "/",
    sections: [
      section("home-top", [
        field("home.welcome.kicker", "Small line above the heading", "short"),
        field("home.welcome.heading", "Heading", "heading"),
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
        ...Array.from({ length: SCHOOL_LEDE_PARAGRAPH_COUNT }, (_, i) =>
          field(`school.lede.${i}`, `Opening paragraph ${displayIndex(i)}`, "body")
        ),
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
        field("school.join.leadBefore", "Opening sentence (the school's email address follows it)", "body"),
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
        field("payments.formNote", "Line under “Make your gift”", "short"),
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
        field("payments.donateIntro", "Paragraph about the programs", "body"),
      ]),
      section("donate-other", [
        field("payments.otherText", "Paragraph", "body"),
        field("payments.zelleText", "Zelle paragraph", "body"),
        field("payments.zelleMemo", "Zelle memo note", "body"),
        field("payments.checkMemo", "Check memo note", "body"),
        field("payments.questionsBefore", "Closing sentence (the center's email address follows it)", "body"),
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
        field("events.lede", "Opening sentence (shown when no event is coming up)", "body"),
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

function wordsOf(segment: string): string {
  if (/^\d+$/.test(segment)) return String(Number(segment) + 1);
  return segment.replace(/([a-z])([A-Z0-9])/g, "$1 $2").toLowerCase();
}

function pageWordsLabel(path: string): string {
  const parts = path
    .split(".")
    .slice(1)
    .map(wordsOf)
    .reduce<string[]>((joined, part) => {
      if (/^\d+$/.test(part) && joined.length > 0) joined[joined.length - 1] += ` ${part}`;
      else joined.push(part);
      return joined;
    }, []);
  const label = parts.join(" — ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Must mirror the `dict.*` namespaces each public page reads. `fromDatabase`
// lists dictionary copies that page renders from the database instead.
const PAGE_WORD_SOURCES: Record<SiteTextPage["id"], { namespaces: string[]; fromDatabase: string[] }> = {
  home: { namespaces: ["home", "groups", "school"], fromDatabase: [] },
  school: { namespaces: ["school", "home"], fromDatabase: ["school.classes.levels", "school.year.events"] },
  events: { namespaces: ["events", "calendar"], fromDatabase: [] },
  groups: { namespaces: ["groups"], fromDatabase: [] },
  donate: { namespaces: ["payments"], fromDatabase: [] },
};

function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`);
}

function pageDrawsWordsFrom(pageId: SiteTextPage["id"], path: string): boolean {
  const { namespaces, fromDatabase } = PAGE_WORD_SOURCES[pageId];
  return (
    namespaces.some((namespace) => isUnder(path, namespace)) &&
    !fromDatabase.some((prefix) => isUnder(path, prefix))
  );
}

const SAFE_SEGMENT = /^[A-Za-z0-9_]+$/;

function pageWordsField(path: string, value: string): SiteTextField {
  const kind: SiteTextKind = value.length > SHORT_FIELD_MAX ? "body" : "short";
  return { path, label: pageWordsLabel(path), kind, max: Math.max(KIND_MAX[kind], value.length * 2) };
}

// Keys the pages look things up by, not words they show: a milestone's id
// finds its photos, and an empty `status` keeps a class open.
const LOOKUP_KEY = /(^|\.)(id|[A-Za-z]+Id|status)$/;

function isPageWords(path: string, value: string): boolean {
  if (FIELDS_BY_PATH.has(path) || LOOKUP_KEY.test(path)) return false;
  // The page fills in "{placeholders}"; an edit that dropped one would break it.
  return value.trim().length > 0 && !value.includes("{");
}

// Paths arrive from the browser, so only the dictionary's own keys are
// followed; "constructor" or "__proto__" would otherwise reach Object itself.
function ownChild(node: unknown, key: string): unknown {
  if (!SAFE_SEGMENT.test(key) || typeof node !== "object" || node === null) return undefined;
  return Object.entries(node).find(([own]) => own === key)?.[1];
}

function ownStringAt(root: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>(ownChild, root);
  return typeof value === "string" ? value : undefined;
}

export function pageWordsFields(pageId: SiteTextPage["id"], en: unknown): SiteTextField[] {
  const fields: SiteTextField[] = [];
  function walk(node: unknown, path: string) {
    if (typeof node === "string") {
      if (pageDrawsWordsFrom(pageId, path) && isPageWords(path, node)) fields.push(pageWordsField(path, node));
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) walk(child, `${path}.${key}`);
  }
  for (const namespace of PAGE_WORD_SOURCES[pageId].namespaces) {
    walk(ownChild(en, namespace), namespace);
  }
  return fields;
}

export function editableSiteTextField(path: string, en: unknown): SiteTextField | undefined {
  const listed = FIELDS_BY_PATH.get(path);
  if (listed) return listed;
  if (!SITE_TEXT_PAGES.some((page) => pageDrawsWordsFrom(page.id, path))) return undefined;
  const value = ownStringAt(en, path);
  if (value === undefined || !isPageWords(path, value)) return undefined;
  return pageWordsField(path, value);
}
