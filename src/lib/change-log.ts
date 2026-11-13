import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  SITE_SETTINGS_ID,
  VOLUNTEER_SECTION_ID,
  allowedEmails,
  boardMembers,
  changeLog,
  events,
  groups,
  schoolLevels,
  schoolYearEvents,
  sitePhotos,
  siteSettings,
  siteText,
  users,
  volunteerSection,
  type ChangeAction,
} from "@/db/schema";

export type Editor = { email?: string | null; name?: string | null };
type Row = Record<string, unknown>;
type Snapshot = { label: string; row: Row };

type ChangeKindSpec = {
  area: string;
  missingMeansOriginal?: boolean;
  snapshot: (id: string) => Promise<Snapshot | undefined>;
};

function changeKind<T extends Row>(spec: {
  area: string;
  missingMeansOriginal?: boolean;
  read: (id: string) => Promise<T | undefined>;
  label: (row: T) => string;
}): ChangeKindSpec {
  return {
    area: spec.area,
    missingMeansOriginal: spec.missingMeansOriginal,
    snapshot: async (id) => {
      const row = await spec.read(id);
      return row && { label: spec.label(row), row };
    },
  };
}

function first<T>(rows: T[]): T | undefined {
  return rows[0];
}

export const CHANGE_KINDS = {
  event: changeKind({
    area: "Event",
    read: (id) => db.select().from(events).where(eq(events.id, id)).then(first),
    label: (row) => row.title,
  }),
  group: changeKind({
    area: "Group",
    read: (id) => db.select().from(groups).where(eq(groups.id, id)).then(first),
    label: (row) => row.name,
  }),
  boardMember: changeKind({
    area: "Board member",
    read: (id) => db.select().from(boardMembers).where(eq(boardMembers.id, id)).then(first),
    label: (row) => row.name,
  }),
  volunteerSection: changeKind({
    area: "Board & volunteers section",
    missingMeansOriginal: true,
    read: () =>
      db
        .select()
        .from(volunteerSection)
        .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID))
        .then(first),
    label: (row) => row.title,
  }),
  siteSettings: changeKind({
    area: "Site details",
    missingMeansOriginal: true,
    read: () =>
      db.select().from(siteSettings).where(eq(siteSettings.id, SITE_SETTINGS_ID)).then(first),
    label: () => "Contact, donation, banner and video details",
  }),
  siteText: changeKind({
    area: "Words on a page",
    missingMeansOriginal: true,
    read: (path) => db.select().from(siteText).where(eq(siteText.path, path)).then(first),
    label: (row) => row.path,
  }),
  sitePhoto: changeKind({
    area: "Photo on a page",
    missingMeansOriginal: true,
    read: (slot) => db.select().from(sitePhotos).where(eq(sitePhotos.slot, slot)).then(first),
    label: (row) => row.slot,
  }),
  schoolLevel: changeKind({
    area: "Japanese School class",
    read: (id) => db.select().from(schoolLevels).where(eq(schoolLevels.id, id)).then(first),
    label: (row) => row.name,
  }),
  schoolYearEvent: changeKind({
    area: "School year event",
    read: (id) =>
      db.select().from(schoolYearEvents).where(eq(schoolYearEvents.id, id)).then(first),
    label: (row) => row.title,
  }),
  signInAccess: changeKind({
    area: "Who can sign in",
    read: (email) =>
      db.select().from(allowedEmails).where(eq(allowedEmails.email, email)).then(first),
    label: (row) => row.email,
  }),
  profile: changeKind({
    area: "Profile",
    read: (id) =>
      db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, id))
        .then(first),
    label: (row) => row.email,
  }),
} satisfies Record<string, ChangeKindSpec>;

export type ChangeKind = keyof typeof CHANGE_KINDS;

const ORDERED_KINDS = {
  group: () => db.select({ name: groups.name }).from(groups).orderBy(asc(groups.sortOrder)),
  boardMember: () =>
    db.select({ name: boardMembers.name }).from(boardMembers).orderBy(asc(boardMembers.sortOrder)),
  schoolLevel: () =>
    db.select({ name: schoolLevels.name }).from(schoolLevels).orderBy(asc(schoolLevels.sortOrder)),
} satisfies Partial<Record<ChangeKind, () => Promise<{ name: string }[]>>>;

const UNTRACKED_FIELDS = new Set([
  "id",
  "slug",
  "key",
  "createdById",
  "createdAt",
  "updatedAt",
  "addedAt",
  "sortOrder",
  "width",
  "height",
]);

export function changedFields(before: Row | null, after: Row | null): string[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...keys].filter(
    (key) =>
      !UNTRACKED_FIELDS.has(key) &&
      JSON.stringify(before?.[key] ?? null) !== JSON.stringify(after?.[key] ?? null)
  );
}

async function record(
  editor: Editor,
  kind: ChangeKind,
  recordId: string,
  action: ChangeAction,
  label: string,
  before: Row | null,
  after: Row | null
) {
  const toJson = (row: Row | null): Row | null => row && JSON.parse(JSON.stringify(row));
  await db.insert(changeLog).values({
    editorEmail: editor.email ?? null,
    editorName: editor.name ?? null,
    kind,
    recordId,
    label,
    action,
    before: toJson(before),
    after: toJson(after),
  });
}

// History is a record for the site owner, never a reason to fail a volunteer's save.
async function recordSafely(work: () => Promise<void>) {
  try {
    await work();
  } catch (error) {
    console.error("Failed to record a change in the history:", error);
  }
}

export async function trackChange<T>(
  editor: Editor,
  kind: ChangeKind,
  recordId: string,
  write: () => Promise<T>
): Promise<T> {
  const spec: ChangeKindSpec = CHANGE_KINDS[kind];
  let before: Snapshot | undefined;
  try {
    before = await spec.snapshot(recordId);
  } catch (error) {
    console.error("Failed to read a record before changing it:", error);
    return write();
  }

  const result = await write();

  await recordSafely(async () => {
    const after = await spec.snapshot(recordId);
    if (!changedFields(before?.row ?? null, after?.row ?? null).length) return;
    const action = !before ? "added" : !after ? "removed" : "changed";
    const label = after?.label ?? before?.label ?? recordId;
    await record(editor, kind, recordId, action, label, before?.row ?? null, after?.row ?? null);
  });
  return result;
}

export async function trackOrder<T>(
  editor: Editor,
  kind: keyof typeof ORDERED_KINDS,
  write: () => Promise<T>
): Promise<T> {
  const readOrder = async () => (await ORDERED_KINDS[kind]()).map((row) => row.name);
  let before: string[];
  try {
    before = await readOrder();
  } catch (error) {
    console.error("Failed to read the order before changing it:", error);
    return write();
  }

  const result = await write();

  await recordSafely(async () => {
    const after = await readOrder();
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    await record(editor, kind, "order", "reordered", "Order on the page", { order: before }, { order: after });
  });
  return result;
}
