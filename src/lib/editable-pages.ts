import { PHOTO_SLOTS, type PhotoSlot } from "@/lib/photo-slots";
import {
  assertSiteTextRegistry,
  SITE_TEXT_PAGES,
  type SiteTextField,
} from "@/lib/site-text-fields";

const EDITABLE_PAGE_IDS = ["home", "school", "events", "groups", "donate"] as const;

export type EditablePageId = (typeof EDITABLE_PAGE_IDS)[number];

export type EditableSection = {
  id: string;
  label: string;
  fields: SiteTextField[];
  photos: PhotoSlot[];
};

export type EditablePage = {
  id: EditablePageId;
  label: string;
  href: string;
  sections: EditableSection[];
};

const PAGE_LABELS: Record<EditablePageId, string> = {
  home: "Home page",
  school: "Japanese School page",
  events: "Events page",
  groups: "Sports & Classes page",
  donate: "Donations page",
};

const SECTION_ORDER: Record<EditablePageId, { id: string; label: string }[]> = {
  home: [
    { id: "home-top", label: "Top of the page" },
    { id: "home-japanese-school", label: "Japanese School" },
    { id: "home-sports-clubs", label: "Sports, Clubs & Classes" },
    { id: "home-history", label: "Our History" },
    { id: "home-connect", label: "Our Community" },
  ],
  school: [
    { id: "school-top", label: "Top of the page" },
    { id: "school-classes", label: "Class descriptions" },
    { id: "school-tuition", label: "Tuition & dues" },
    { id: "school-then-now", label: "Then & now" },
    { id: "school-history", label: "History of the school" },
    { id: "school-join", label: "Join us" },
  ],
  events: [
    { id: "events-top", label: "Top of the page" },
    { id: "events-past", label: "Past events" },
  ],
  groups: [
    { id: "groups-top", label: "Top of the page" },
    { id: "groups-start", label: "Start a club" },
  ],
  donate: [
    { id: "donate-top", label: "Top of the page" },
    { id: "donate-reasons", label: "Why we need your support" },
    { id: "donate-mosaic", label: "A Century of Gathering" },
    { id: "donate-other", label: "More Ways to Give" },
  ],
};

function fieldsFor(pageId: EditablePageId, sectionId: string): SiteTextField[] {
  const page = SITE_TEXT_PAGES.find((p) => p.id === pageId);
  return page?.sections.find((s) => s.id === sectionId)?.fields ?? [];
}

function photosFor(pageId: EditablePageId, sectionId: string): PhotoSlot[] {
  return PHOTO_SLOTS.filter((slot) => slot.page === pageId && slot.section === sectionId);
}

function hrefFor(pageId: EditablePageId): string {
  const page = SITE_TEXT_PAGES.find((p) => p.id === pageId);
  if (!page) throw new Error(`No href registered for editable page "${pageId}".`);
  return page.href;
}

export const EDITABLE_PAGES: EditablePage[] = EDITABLE_PAGE_IDS.map((pageId) => ({
  id: pageId,
  label: PAGE_LABELS[pageId],
  href: hrefFor(pageId),
  sections: SECTION_ORDER[pageId].map(({ id, label }) => ({
    id,
    label,
    fields: fieldsFor(pageId, id),
    photos: photosFor(pageId, id),
  })),
}));

const PAGES_BY_ID = new Map<string, EditablePage>(EDITABLE_PAGES.map((page) => [page.id, page]));

export function editablePage(id: string): EditablePage | undefined {
  return PAGES_BY_ID.get(id);
}

export function assertEditablePagesRegistry(en: unknown): void {
  assertSiteTextRegistry(en);

  const emptySections = EDITABLE_PAGES.flatMap((page) =>
    page.sections
      .filter((section) => section.fields.length === 0 && section.photos.length === 0)
      .map((section) => `${page.id}:${section.id}`)
  );
  if (emptySections.length > 0) {
    throw new Error(
      `The page-editors registry declares sections with no fields and no photos: ${emptySections.join(", ")}`
    );
  }

  const declaredSectionsByPage = new Map(
    EDITABLE_PAGES.map((page) => [page.id, new Set(page.sections.map((s) => s.id))])
  );

  const badSlots = PHOTO_SLOTS.filter(
    (slot) => !declaredSectionsByPage.get(slot.page)?.has(slot.section)
  ).map((slot) => slot.id);
  if (badSlots.length > 0) {
    throw new Error(
      `These photo slots have a section not declared in the page editors' order: ${badSlots.join(", ")}`
    );
  }

  const badTextSections = SITE_TEXT_PAGES.flatMap((page) => {
    const declared = declaredSectionsByPage.get(page.id);
    if (!declared) return [];
    return page.sections
      .filter((section) => !declared.has(section.id))
      .map((section) => `${page.id}:${section.id}`);
  });
  if (badTextSections.length > 0) {
    throw new Error(
      `These text sections have no home in the page editors' order: ${badTextSections.join(", ")}`
    );
  }
}
