import { FLYER_THEMES, OTHER_THEME } from "@/lib/flyer-art";
import { AdminError } from "@/lib/action-result";
import { isUploadedFileUrl } from "@/lib/format";

export type FlyerTemplate = { id: string; themeIds: readonly string[]; name: string; src: string };

function template(id: string, themeIds: readonly string[], name: string): FlyerTemplate {
  return { id, themeIds, name, src: `/flyer-templates/${id}.jpg` };
}

// Append-only: saved events point at these paths, so never remove, rename or overwrite an entry or its file; add a new id instead.
export const FLYER_TEMPLATES: readonly FlyerTemplate[] = [
  template("bingo-1", ["bingo"], "Bingo cage and cards"),
  template("bingo-2", ["bingo"], "Lucky numbers at night"),
  template("bingo-3", ["bingo"], "Bingo balls and prizes"),
  template("pancake-1", ["pancake"], "Pancake stack, aloha morning"),
  template("pancake-2", ["pancake"], "Breakfast table"),
  template("boutique-1", ["boutique"], "Holiday craft fair"),
  template("boutique-2", ["boutique"], "Handmade gifts and cranes"),
  template("festival-1", ["festival"], "Summer festival lanterns"),
  template("festival-2", ["festival"], "Ondo dancers and taiko"),
  template("festival-3", ["festival"], "Festival games and food"),
  template("dance-1", ["dance", "reverse-draw"], "Dinner and dance night"),
  template("dance-2", ["dance", "reverse-draw"], "Line dance evening"),
  template("dance-3", ["dance", "reverse-draw"], "Ballroom under the lights"),
  template("keiro-1", ["keiro"], "Keiro no Hi luncheon"),
  template("new-year-1", ["new-year"], "New Year celebration"),
  template("halloween-1", ["halloween"], "Halloween party"),
  template("taiko-1", ["taiko"], "Taiko drums"),
  template("dojo-1", ["dojo"], "Dojo and martial arts"),
  template("school-1", ["school"], "Japanese School day"),
  template("arts-1", ["arts"], "Ikebana and arts"),
  template("celebration-1", ["celebration"], "Anniversary celebration"),
  template("sports-1", ["sports"], "Sports day"),
  template("volunteer-1", ["volunteer"], "Volunteers at work"),
];

const TEMPLATE_SRCS = new Set(FLYER_TEMPLATES.map((entry) => entry.src));

export function templatesForTheme(themeId: string): FlyerTemplate[] {
  if (themeId === OTHER_THEME || !FLYER_THEMES.some((theme) => theme.id === themeId)) {
    return [...FLYER_TEMPLATES];
  }
  return FLYER_TEMPLATES.filter((entry) => entry.themeIds.includes(themeId));
}

export function isFlyerTemplateSrc(raw: string): boolean {
  return TEMPLATE_SRCS.has(raw);
}

export function normalizeFlyerArtUrl(raw: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (isFlyerTemplateSrc(trimmed) || isUploadedFileUrl(trimmed)) return trimmed;
  throw new AdminError("The flyer picture didn’t load correctly. Try choosing it again.");
}
