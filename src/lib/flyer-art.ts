import { excerpt } from "@/lib/format";

export const FLYER_ART_MODEL = "bfl/flux-3-image-klein";
export const FLYER_ART_CHOICES = 3;
export const FLYER_ART_DAILY_LIMIT = 30;
export const FLYER_IDEA_MAX_LENGTH = 300;

const ART_STYLES = [
  "a Japanese ukiyo-e woodblock print with flat colors and bold outlines",
  "a soft watercolor painting on textured washi paper",
  "a layered paper-cut collage with gentle shadows",
  "a cheerful mid-century poster illustration built from simple shapes",
  "a hand-painted gouache storybook illustration",
  "a sumi-e ink painting with bright touches of color",
  "a bold, modern flat illustration with a small, harmonious palette",
];

const SEASONS = [
  { months: [11, 0, 1], touches: "winter: camellias, plum blossoms, cozy warm light" },
  { months: [2, 3, 4], touches: "spring: cherry blossoms and fresh green leaves" },
  { months: [5, 6, 7], touches: "summer: paper fans, morning glories, festival lanterns" },
  { months: [8, 9, 10], touches: "autumn: red maple leaves, persimmons, golden light" },
];

const DESCRIPTION_CELLS = 400;

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The model draws pictures only: every word on the flyer is lettered on
// afterwards, because image models misspell English and garble Japanese.
export function flyerArtPrompts({
  title,
  description,
  date,
  idea,
}: {
  title: string;
  description: string;
  date: Date | null;
  idea: string;
}): string[] {
  const month = (date ?? new Date()).getUTCMonth();
  const season = SEASONS.find((s) => s.months.includes(month)) ?? SEASONS[0];
  const about = description.trim()
    ? ` About the event: ${excerpt(description.trim(), DESCRIPTION_CELLS)}`
    : "";
  const wish = idea.trim()
    ? `What the organizer would love to see in the picture: ${idea.trim().slice(0, FLYER_IDEA_MAX_LENGTH)}.`
    : "";

  return shuffled(ART_STYLES)
    .slice(0, FLYER_ART_CHOICES)
    .map((style) =>
      [
        `An illustration for a community flyer. The event: ${title.trim()}.${about}`,
        wish,
        "It takes place at a Japanese-American community center, so let Japanese design shape the picture.",
        `Seasonal touches for ${season.touches}.`,
        `Drawn as ${style}. Warm, welcoming and joyful, for all ages.`,
        "Keep the bottom third of the picture simple and calm; the event details will be printed over it.",
        "Do not draw any text, letters, numbers, signs, banners or writing of any kind.",
      ]
        .filter(Boolean)
        .join(" "),
    );
}
