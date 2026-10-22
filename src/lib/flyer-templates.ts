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
  template("bingo-2", ["bingo"], "Lucky balls at night"),
  template("bingo-3", ["bingo"], "Bingo doodles"),
  template("bingo-4", ["bingo"], "Bingo table under the lights"),
  template("pancake-1", ["pancake"], "Pancake stack, aloha morning"),
  template("pancake-2", ["pancake"], "Breakfast table"),
  template("pancake-3", ["pancake"], "Breakfast counter at sunrise"),
  template("boutique-1", ["boutique"], "Holiday craft fair"),
  template("boutique-2", ["boutique"], "Gifts on a gold screen"),
  template("boutique-3", ["boutique"], "Boutique tables at night"),
  template("festival-1", ["festival"], "Festival lanterns at dusk"),
  template("festival-2", ["festival"], "Yagura and lanterns"),
  template("festival-3", ["festival"], "Festival games and food"),
  template("festival-4", ["festival"], "Lanterns above, food below"),
  template("dance-1", ["dance", "reverse-draw"], "Dinner and dance night"),
  template("dance-2", ["dance", "reverse-draw"], "Line dance evening"),
  template("dance-3", ["dance", "reverse-draw"], "Dancing shoes on a gold screen"),
  template("dance-4", ["dance", "reverse-draw"], "Reverse draw table"),
  template("keiro-1", ["keiro"], "Keiro no Hi bento and tea"),
  template("keiro-2", ["keiro"], "Cranes and chrysanthemums"),
  template("new-year-1", ["new-year"], "New Year rising sun"),
  template("new-year-2", ["new-year"], "New Year table"),
  template("halloween-1", ["halloween"], "Pumpkins and lanterns"),
  template("halloween-2", ["halloween"], "Haunted doorway"),
  template("taiko-1", ["taiko"], "Three taiko drums"),
  template("taiko-2", ["taiko"], "The big odaiko"),
  template("dojo-1", ["dojo"], "Judo fundraiser: mochi and gi"),
  template("dojo-2", ["dojo"], "Dojo wall and belts"),
  template("school-1", ["school"], "Classroom ready for class"),
  template("school-2", ["school"], "Koinobori and a school desk"),
  template("arts-1", ["arts"], "Ikebana, koto and ukulele"),
  template("arts-2", ["arts"], "Arts showcase on navy"),
  template("celebration-1", ["celebration"], "Balloons and cake"),
  template("celebration-2", ["celebration"], "Awards night stage"),
  template("sports-1", ["sports"], "Field day gear"),
  template("sports-2", ["sports"], "Basketball gym"),
  template("volunteer-1", ["volunteer"], "Clean-up day tools"),
  template("volunteer-2", ["volunteer"], "Thank-you table"),
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
