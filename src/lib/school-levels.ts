import { asc } from "drizzle-orm";
import { db } from "@/db";
import { schoolLevels, type SchoolLevel, type SchoolLevelStatus } from "@/db/schema";
import { failSoft } from "@/lib/fail-soft";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { photoFor, schoolPhotos } from "@/lib/photos";
import type { SitePhotoSource } from "@/components/site-photo";

export type SchoolLevelView = {
  id: string;
  name: string;
  kanji: string | null;
  summary: string;
  status: SchoolLevelStatus;
  description: string;
  points: string[];
  photo: SitePhotoSource | undefined;
};

function statusFromNotice(notice: string): SchoolLevelStatus {
  return notice ? "unavailable" : "open";
}

async function dictionaryLevels(locale: Locale): Promise<SchoolLevelView[]> {
  const dict = await getBaseDictionaryFor(locale);
  return dict.school.classes.levels.map((level, i) => ({
    id: `dictionary-${i}`,
    name: level.name,
    kanji: level.nameJa,
    summary: level.summary,
    status: statusFromNotice(level.status),
    description: level.description,
    points: level.points,
    photo: photoFor(schoolPhotos.levels[i], level.photoAlt),
  }));
}

export async function getSchoolLevels(locale: Locale): Promise<SchoolLevelView[]> {
  const rows = await failSoft(
    db.select().from(schoolLevels).orderBy(asc(schoolLevels.sortOrder)),
    []
  );

  if (rows.length === 0) return dictionaryLevels(locale);

  return rows
    .filter((row) => row.visible)
    .map((row) => ({
      id: row.id,
      name: locale === "ja" ? row.nameJa ?? row.name : row.name,
      kanji: row.kanji,
      summary: locale === "ja" ? row.summaryJa ?? row.summary : row.summary,
      status: row.status,
      description: locale === "ja" ? row.descriptionJa ?? row.description : row.description,
      points: locale === "ja" && row.pointsJa.length > 0 ? row.pointsJa : row.points,
      photo: photoFor(
        row.photoUrl ?? undefined,
        locale === "ja" ? row.photoAltJa ?? row.photoAlt : row.photoAlt
      ),
    }));
}

export async function getAllSchoolLevels(): Promise<SchoolLevel[]> {
  return db.select().from(schoolLevels).orderBy(asc(schoolLevels.sortOrder));
}
