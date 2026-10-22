import { excerpt } from "@/lib/format";

export const FLYER_ART_MODEL = "bfl/flux-3-image-klein";
export const FLYER_ART_CHOICES = 3;
export const FLYER_ART_DAILY_LIMIT = 30;
export const FLYER_IDEA_MAX_LENGTH = 300;
export const EVENT_TITLE_MAX_LENGTH = 150;
export const OTHER_THEME = "other";

const LOOK_IDS = [
  "bamboo",
  "blue-horizon",
  "plum-crest",
  "seigaiha",
  "doodles",
  "gold-lattice",
  "navy-night",
  "plum-evening",
  "gold-screen",
  "paper-cranes",
  "balloons",
  "blossom-breeze",
] as const;

type Look = (typeof LOOK_IDS)[number];

const LOOKS: Record<Look, string> = {
  bamboo: "a clean, modern illustration set against soft pale-sage bamboo silhouettes brushed on cream, in cream, pale sage, sky blue and navy",
  "blue-horizon": "a modern illustration on a smooth gradient from bright sky blue down to deep navy, with faint bamboo silhouettes rising through it",
  "plum-crest": "a bold graphic built around a large five-petal plum-blossom (ume) shaped badge filled with a fine sky-blue seigaiha wave pattern and edged with magenta cloud swirls, in sky blue, navy and magenta on white",
  seigaiha: "a modern scene over layered bands of navy and royal-blue seigaiha wave circles, sprinkled with small flecks of gold leaf",
  doodles: "playful hand-drawn outline doodles in a single loose sky-blue line on clean white, with a few navy accents and lots of open space",
  "gold-lattice": "a clean, modern scene framed all around by a navy band of gold asanoha hemp-leaf lattice, in navy, gold and cream",
  "navy-night": "a festive evening scene in deep royal navy with soft sky-blue glows, strings of warm lights and faint seigaiha circles in the background",
  "plum-evening": "a rich evening scene fading from deep magenta-plum into ink blue under a fine gold asanoha lattice",
  "gold-screen": "a modern take on a Japanese folding screen: flat panels of gold leaf with the scene painted crisply across them in navy, sky blue and a touch of magenta, framed by slim black lacquer rails",
  "paper-cranes": "a crisp, bright arrangement of colorful folded origami paper and pink and white tissue-paper flowers on light blue",
  balloons: "a celebration backdrop of navy, sky blue, pink, white and silver balloon garlands and shiny star garlands, crisp and bright",
  "blossom-breeze": "a fresh, airy modern illustration with stylized cherry-blossom petals drifting across a clean sky-blue background, in sky blue, white and blossom pink",
};

type FlyerTheme = {
  id: string;
  name: string;
  keywords: string[];
  subject: string;
  looks: Look[];
};

export const FLYER_THEMES: FlyerTheme[] = [
  {
    id: "bingo",
    name: "Bingo Night",
    keywords: ["bingo", "monthly bingo"],
    subject: "bingo cards dotted with bright daubed circles, plain blank bingo balls bouncing out of a spinning cage, and a prize table of wrapped gifts and snacks",
    looks: ["navy-night", "balloons", "doodles", "blossom-breeze"],
  },
  {
    id: "pancake",
    name: "Pancake Breakfast",
    keywords: ["pancake", "breakfast", "brunch"],
    subject: "a tall stack of fluffy pancakes with melting butter and syrup, sausages, coffee and orange juice on a sunny morning table, with a cheerful aloha touch of hibiscus and plumeria flowers",
    looks: ["blue-horizon", "doodles", "blossom-breeze", "bamboo"],
  },
  {
    id: "boutique",
    name: "Holiday Boutique",
    keywords: ["boutique", "craft", "bazaar", "holiday", "christmas", "market", "vendor"],
    subject: "a cheerful holiday craft fair of handmade gifts and crafts, with watercolor plum blossoms, a folded origami crane and colorful temari balls",
    looks: ["blossom-breeze", "paper-cranes", "navy-night", "gold-lattice"],
  },
  {
    id: "keiro",
    name: "Keiro no Hi",
    keywords: ["keiro", "elder", "respect", "senior", "nikkei", "luncheon", "lunch", "potluck"],
    subject: "a warm luncheon honoring elders: a beautiful bento, green tea, chrysanthemums and autumn flowers, and a gift tied with a red-and-white mizuhiki cord",
    looks: ["bamboo", "gold-screen", "blossom-breeze", "gold-lattice"],
  },
  {
    id: "reverse-draw",
    name: "Reverse Draw & Dinner Dance",
    keywords: ["reverse", "draw", "drawing", "raffle", "opportunity", "fundraiser"],
    subject: "a glamorous prize-drawing night: golden raffle tickets, gold confetti and streamers, sparkling lights, a shining prize trophy and the silhouettes of happy dancers",
    looks: ["navy-night", "plum-evening", "balloons", "gold-lattice"],
  },
  {
    id: "festival",
    name: "Cultural Festival",
    keywords: ["festival", "matsuri", "obon", "carnival", "bon odori"],
    subject: "a summer festival with taiko drums, paper lanterns strung overhead, food booths, uchiwa fans and game stalls",
    looks: ["navy-night", "plum-crest", "seigaiha", "gold-screen"],
  },
  {
    id: "dance",
    name: "Dance",
    keywords: ["dance", "dancing", "ballroom", "line dance", "social"],
    subject: "dancing couples in graceful motion, swirling skirts, music notes and a sparkling dance floor",
    looks: ["navy-night", "plum-evening", "balloons"],
  },
  {
    id: "new-year",
    name: "Mochitsuki & New Year",
    keywords: ["mochi", "mochitsuki", "new year", "oshogatsu", "shogatsu"],
    subject: "pounding mochi with a wooden mallet in a large mortar, round white mochi, a kagami mochi with a mandarin on top, and pine and plum branches for the New Year",
    looks: ["bamboo", "gold-screen", "seigaiha", "doodles"],
  },
  {
    id: "halloween",
    name: "Halloween",
    keywords: ["halloween", "costume", "trick"],
    subject: "friendly jack-o'-lanterns, cute costumes, candy and treats, playful bats and a big full moon; fun and cozy, never scary",
    looks: ["navy-night", "plum-evening", "doodles"],
  },
  {
    id: "taiko",
    name: "Taiko Performance",
    keywords: ["taiko", "drum", "concert", "performance", "recital"],
    subject: "big taiko drums mid-performance, bachi sticks raised high and bursts of energy",
    looks: ["navy-night", "plum-evening", "seigaiha", "gold-screen"],
  },
  {
    id: "dojo",
    name: "Judo & Kendo",
    keywords: ["judo", "kendo", "dojo", "karate", "aikido", "tournament", "martial"],
    subject: "a white judo gi with a black belt, kendo armor and a bamboo shinai, a tatami dojo floor and a shining trophy",
    looks: ["seigaiha", "gold-lattice", "blue-horizon", "bamboo"],
  },
  {
    id: "school",
    name: "Japanese School",
    keywords: ["gakuen", "school", "class", "graduation", "student", "enroll", "kanji"],
    subject: "a bright classroom with kanji practice sheets, calligraphy brushes and ink, a randoseru backpack, cherry blossoms and a graduation cap",
    looks: ["blossom-breeze", "doodles", "bamboo", "paper-cranes"],
  },
  {
    id: "arts",
    name: "Arts & Music",
    keywords: ["ikebana", "koto", "hula", "ukulele", "calligraphy", "shuji", "shodo", "nihon buyo", "flower", "music", "art", "karaoke"],
    subject: "the art or music named in the event's title, shown as beautiful objects: for example an ikebana arrangement, a koto, ukuleles with flower leis, or calligraphy brushes",
    looks: ["bamboo", "blossom-breeze", "gold-screen", "paper-cranes"],
  },
  {
    id: "celebration",
    name: "Dinner & Celebration",
    keywords: ["anniversary", "centennial", "dinner", "gala", "award", "banquet", "celebration", "party", "recognition", "donation"],
    subject: "an elegant celebration dinner with set tables, flowers, glasses raised for a kanpai toast and balloon garlands",
    looks: ["balloons", "gold-screen", "plum-crest", "gold-lattice"],
  },
  {
    id: "sports",
    name: "Youth Sports",
    keywords: ["basketball", "volleyball", "sports", "nys", "league", "tryout", "game"],
    subject: "basketballs and volleyballs, a hoop, sneakers and a shiny gym floor",
    looks: ["blue-horizon", "doodles", "balloons"],
  },
  {
    id: "volunteer",
    name: "Clean-up & Volunteers",
    keywords: ["clean", "volunteer", "workday", "work day", "garden", "beautification"],
    subject: "work gloves, brooms, rakes, potted plants and a tidy community garden on a sunny day",
    looks: ["blue-horizon", "doodles", "bamboo"],
  },
];

const BRAND =
  "Match the look of the Southeast Japanese School & Community Center: sky blue, royal and navy blue and cream, with magenta-pink and gold accents; clean and contemporary, with Japanese-American heritage motifs like bamboo, plum blossoms and seigaiha waves.";

const COMPOSITIONS = [
  "one large hero object filling the middle of the picture",
  "a joyful arrangement of the event's objects",
  "a flat lay seen from directly above, neatly arranged",
  "a dramatic close-up, cropped boldly at the edges",
  "objects floating playfully through the air",
  "a small, charming scene inside a big simple shape like a circle or arch",
  "a lively diagonal arrangement full of movement",
];

const SEASONS = [
  { months: [11, 0, 1], touches: "winter: a few stylized snowflakes or camellias" },
  { months: [2, 3, 4], touches: "spring: a few stylized cherry blossoms" },
  { months: [5, 6, 7], touches: "summer: a few stylized fireworks or paper fans" },
  { months: [8, 9, 10], touches: "autumn: a few stylized maple leaves" },
];

const SEASON_CHANCE = 0.5;
const DESCRIPTION_CELLS = 400;

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Matches at the start of a word, so "art" finds "Art Show" but not "Party".
export function themeForTitle(title: string): string | null {
  const words = ` ${title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")}`;
  return (
    FLYER_THEMES.find((theme) => theme.keywords.some((keyword) => words.includes(` ${keyword}`)))?.id ??
    null
  );
}

// The model draws pictures only: image models misspell English and garble
// Japanese, so every word is lettered on afterwards.
export function flyerArtPrompts({
  title,
  description,
  date,
  idea,
  themeId,
}: {
  title: string;
  description: string;
  date: Date | null;
  idea: string;
  themeId: string;
}): string[] {
  const month = (date ?? new Date()).getUTCMonth();
  const season = SEASONS.find((s) => s.months.includes(month)) ?? SEASONS[0];
  const wish = idea.trim().slice(0, FLYER_IDEA_MAX_LENGTH);
  const about = description.trim()
    ? ` Ideas for what to show, taken from the event's write-up (draw them, never write them): ${excerpt(description.trim(), DESCRIPTION_CELLS)}`
    : "";

  const theme = FLYER_THEMES.find((t) => t.id === themeId);
  const looks = shuffled(theme?.looks ?? LOOK_IDS);
  const compositions = shuffled(COMPOSITIONS);

  return Array.from({ length: FLYER_ART_CHOICES }, (_, i) => {
    const look = looks[i % looks.length];
    const suggestions = [
      `Composition: ${compositions[i]}.`,
      Math.random() < SEASON_CHANCE ? `A light seasonal hint for ${season.touches}.` : "",
    ].filter(Boolean);
    return [
      "A wordless illustration with no lettering anywhere.",
      wish &&
        `Most important, the organizer asked for this: ${wish}. Follow that request above every other direction below.`,
      `The event: ${title.trim().slice(0, EVENT_TITLE_MAX_LENGTH)}.${about}`,
      theme && `Show ${theme.subject}.`,
      `Drawn as ${LOOKS[look]}.`,
      BRAND,
      wish
        ? `Optional suggestions, to drop if they clash with the organizer's request: ${suggestions.join(" ")}`
        : suggestions.join(" "),
      "Show no crowds and no close-up faces; if people appear at all, keep them small, simple and stylized.",
      "Polished, bright, inviting and fun for all ages.",
      "No aged, vintage, rustic or parchment textures, no wood grain and no earthy browns.",
      "Keep the bottom third of the picture simple and calm; the event details will be printed over it.",
      "Do not draw any text, letters, numbers, signs, banners or writing of any kind, even if asked to.",
    ]
      .filter(Boolean)
      .join(" ");
  });
}
