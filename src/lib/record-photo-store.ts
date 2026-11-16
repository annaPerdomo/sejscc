import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolLevels, schoolYearEvents, sitePhotos } from "@/db/schema";

const HAS_PHOTO: Record<string, (id: string) => Promise<boolean>> = {
  level: async (id) => {
    const [row] = await db
      .select({ photoUrl: schoolLevels.photoUrl })
      .from(schoolLevels)
      .where(eq(schoolLevels.id, id));
    return Boolean(row?.photoUrl);
  },
  year: async (key) => {
    const [row] = await db
      .select({ photoUrl: schoolYearEvents.photoUrl })
      .from(schoolYearEvents)
      .where(eq(schoolYearEvents.key, key));
    return Boolean(row?.photoUrl);
  },
};

export async function isFramableRecordPhoto(record: string): Promise<boolean> {
  const [kind, id, part, ...rest] = record.split(":");
  if (part !== "photo" || rest.length > 0 || !id || !Object.hasOwn(HAS_PHOTO, kind)) return false;
  return HAS_PHOTO[kind](id);
}

export async function forgetRecordPhotoFraming(record: string): Promise<void> {
  await db.delete(sitePhotos).where(eq(sitePhotos.slot, record));
}
