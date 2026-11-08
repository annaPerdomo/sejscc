import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { VOLUNTEER_SECTION_ID, boardMembers, events, volunteerSection } from "@/db/schema";
import { getActiveGroups } from "@/lib/events";
import type { EditablePageId } from "@/lib/editable-pages";
import { getAllSchoolYearEvents } from "@/lib/school-year-events";
import { assertEditablePagesRegistry, editablePage } from "@/lib/editable-pages";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import { readPath } from "@/lib/object-path";
import { ORIGINAL_PHOTO_URL, framingFromRow } from "@/lib/photo-framing";
import { getAllSchoolLevels } from "@/lib/school-levels";
import { getSitePhotos } from "@/lib/site-photos";
import { getCenterContact, getDonationDetails, getSiteSettings } from "@/lib/site-settings";
import { getSiteTextOverrides } from "@/lib/site-text";
import { pageWordsFields } from "@/lib/site-text-fields";
import type { PhotoTile } from "@/components/admin/inline-edit/photo-slot-tile";
import { PageCanvas } from "./page-canvas";
import type { PageRecords } from "./record-items";

export const dynamic = "force-dynamic";

async function loadBoard(): Promise<PageRecords["board"]> {
  const [[section], members] = await Promise.all([
    db.select().from(volunteerSection).where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID)),
    db
      .select()
      .from(boardMembers)
      .where(eq(boardMembers.visible, true))
      .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.createdAt)),
  ]);
  return section ? { section, members } : null;
}

async function loadDonation(): Promise<PageRecords["donation"]> {
  const [settings, shown] = await Promise.all([getSiteSettings(), getDonationDetails()]);
  return {
    zelleRecipient: settings?.zelleRecipient ?? null,
    checkPayee: settings?.checkPayee ?? null,
    checkAddress: settings?.checkAddress ?? null,
    shownPayee: shown.checkPayee,
    shownAddress: shown.checkAddress,
  };
}

function loadEvents() {
  return db.select({ id: events.id, title: events.title }).from(events).where(eq(events.status, "published"));
}

async function loadPageRecords(pageId: EditablePageId): Promise<PageRecords> {
  const shows = (...pages: EditablePageId[]) => pages.includes(pageId);
  const [levels, yearEvents, groups, board, contact, donation, eventRows] = await Promise.all([
    shows("school") ? getAllSchoolLevels() : [],
    shows("school") ? getAllSchoolYearEvents() : [],
    shows("home", "groups") ? getActiveGroups() : [],
    shows("home") ? loadBoard() : null,
    shows("home", "groups", "donate") ? getCenterContact() : null,
    shows("donate") ? loadDonation() : null,
    shows("home", "events") ? loadEvents() : [],
  ]);
  return { levels, yearEvents, groups, board, contact, donation, events: eventRows };
}

function defaultAltAt(dict: unknown, path: string | null): string {
  if (!path) return "";
  const value = readPath(dict, path);
  return typeof value === "string" ? value : "";
}

export default async function EditablePagePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageId } = await params;
  const page = editablePage(pageId);
  if (!page) notFound();

  const [overrides, en, ja, photos, settings, records] = await Promise.all([
    getSiteTextOverrides(),
    getBaseDictionaryFor("en"),
    getBaseDictionaryFor("ja"),
    getSitePhotos(),
    getSiteSettings(),
    loadPageRecords(page.id),
  ]);

  assertEditablePagesRegistry(en);

  const tiles: Record<string, PhotoTile> = {};
  for (const section of page.sections) {
    for (const slot of section.photos) {
      const row = photos.get(slot.id);
      const original = {
        src: slot.defaultSrc,
        alt: defaultAltAt(en, slot.defaultAltPath),
        altJa: defaultAltAt(ja, slot.defaultAltPath),
      };
      const isReplaced = Boolean(row) && row?.url !== ORIGINAL_PHOTO_URL;
      tiles[slot.id] = {
        slot: slot.id,
        current: row
          ? isReplaced
            ? { src: row.url, alt: row.alt, altJa: row.altJa ?? "", framing: framingFromRow(row) }
            : { ...original, framing: framingFromRow(row) }
          : original,
        original,
        isChanged: isReplaced,
      };
    }
  }

  const links: Record<string, string | null> = {};
  for (const section of page.sections) {
    for (const link of section.links) {
      links[link.id] = settings?.[link.column] ?? null;
    }
  }

  return (
    <PageCanvas
      page={page}
      overrides={Object.fromEntries(overrides)}
      links={links}
      en={en}
      ja={ja}
      tiles={tiles}
      records={records}
      pageWords={pageWordsFields(page.id, en)}
    />
  );
}
