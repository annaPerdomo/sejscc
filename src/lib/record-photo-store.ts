import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolLevels, schoolYearEvents, sitePhotos } from "@/db/schema";
import { deleteBlobIfUnused } from "@/lib/blob-cleanup";

type RecordPhotoRow = { rowId: string; photoUrl: string | null };

const RECORD_PHOTOS: Record<
  string,
  {
    change: "schoolLevel" | "schoolYearEvent";
    read: (id: string) => Promise<RecordPhotoRow | undefined>;
    write: (rowId: string, url: string) => Promise<void>;
  }
> = {
  level: {
    change: "schoolLevel",
    read: async (id) => {
      const [row] = await db
        .select({ rowId: schoolLevels.id, photoUrl: schoolLevels.photoUrl })
        .from(schoolLevels)
        .where(eq(schoolLevels.id, id));
      return row;
    },
    write: async (rowId, url) => {
      await db.update(schoolLevels).set({ photoUrl: url }).where(eq(schoolLevels.id, rowId));
    },
  },
  year: {
    change: "schoolYearEvent",
    read: async (key) => {
      const [row] = await db
        .select({ rowId: schoolYearEvents.id, photoUrl: schoolYearEvents.photoUrl })
        .from(schoolYearEvents)
        .where(eq(schoolYearEvents.key, key));
      return row;
    },
    write: async (rowId, url) => {
      await db.update(schoolYearEvents).set({ photoUrl: url }).where(eq(schoolYearEvents.id, rowId));
    },
  },
};

export async function recordPhoto(record: string): Promise<
  | (RecordPhotoRow & {
      change: "schoolLevel" | "schoolYearEvent";
      write: (url: string) => Promise<void>;
    })
  | undefined
> {
  const [kind, id, part, ...rest] = record.split(":");
  if (part !== "photo" || rest.length > 0 || !id || !Object.hasOwn(RECORD_PHOTOS, kind)) return undefined;
  const { change, read, write } = RECORD_PHOTOS[kind];
  const row = await read(id);
  if (!row) return undefined;
  return { ...row, change, write: (url) => write(row.rowId, url) };
}

export async function isFramableRecordPhoto(record: string): Promise<boolean> {
  return Boolean((await recordPhoto(record))?.photoUrl);
}

export async function forgetRecordPhotoSettings(record: string): Promise<void> {
  const [row] = await db.select().from(sitePhotos).where(eq(sitePhotos.slot, record));
  if (!row) return;
  await db.delete(sitePhotos).where(eq(sitePhotos.slot, record));
  if (row.cropSource) await deleteBlobIfUnused(row.cropSource);
}
