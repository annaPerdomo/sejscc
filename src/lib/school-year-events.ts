import { asc } from "drizzle-orm";
import { db } from "@/db";
import { schoolYearEvents, type SchoolYearEvent } from "@/db/schema";
import { failSoft } from "@/lib/fail-soft";
import { getBaseDictionaryFor } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { photoFor, schoolPhotos } from "@/lib/photos";
import type { SchoolYearEventInput } from "@/lib/school-year";

export type SchoolYearEventRow = SchoolYearEventInput;

const EVENT_PHOTOS: Partial<Record<string, string>> = schoolPhotos.events;

async function dictionaryEvents(locale: Locale): Promise<SchoolYearEventRow[]> {
  const dict = await getBaseDictionaryFor(locale);
  return dict.school.year.events.map((event) => ({
    id: event.id,
    month: event.month,
    abbr: event.abbr,
    termJa: event.termJa,
    gloss: event.gloss,
    label: event.label,
    when: event.when,
    title: event.title,
    description: event.description,
    photo: photoFor(EVENT_PHOTOS[event.id], event.photoAlt),
  }));
}

export async function getSchoolYearEvents(locale: Locale): Promise<SchoolYearEventRow[]> {
  const rows = await failSoft(
    db
      .select()
      .from(schoolYearEvents)
      .orderBy(asc(schoolYearEvents.month), asc(schoolYearEvents.sortOrder)),
    []
  );

  if (rows.length === 0) return dictionaryEvents(locale);

  return rows
    .filter((row) => row.visible)
    .map((row) => ({
      id: row.key,
      month: row.month,
      abbr: locale === "ja" ? row.abbrJa ?? row.abbr : row.abbr,
      termJa: row.termJa,
      gloss: locale === "ja" ? row.glossJa ?? row.gloss : row.gloss,
      label: locale === "ja" ? row.labelJa ?? row.label : row.label,
      when: locale === "ja" ? row.whenJa ?? row.when : row.when,
      title: locale === "ja" ? row.titleJa ?? row.title : row.title,
      description: locale === "ja" ? row.descriptionJa ?? row.description : row.description,
      photo: photoFor(
        row.photoUrl ?? undefined,
        locale === "ja" ? row.photoAltJa ?? row.photoAlt : row.photoAlt
      ),
    }));
}

export async function getAllSchoolYearEvents(): Promise<SchoolYearEvent[]> {
  return db
    .select()
    .from(schoolYearEvents)
    .orderBy(asc(schoolYearEvents.month), asc(schoolYearEvents.sortOrder));
}
