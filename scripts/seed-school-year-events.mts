import { neon } from "@neondatabase/serverless";
import en from "../src/dictionaries/en.json" with { type: "json" };
import ja from "../src/dictionaries/ja.json" with { type: "json" };

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Mirrors `schoolPhotos.events` in src/lib/photos.ts, keyed by dictionary id.
const PHOTOS: Record<string, string> = {
  hinamatsuri: "/photos/month-hinamatsuri.jpg",
  kodomonohi: "/photos/month-kodomonohi.jpg",
  tanabata: "/photos/month-tanabata.jpg",
  shigyo: "/photos/month-shigyo.jpg",
  jugyosankan: "/photos/month-jugyosankan-classroom.jpg",
  undokai: "/photos/month-undokai.jpg",
  shichigosan: "/photos/month-shichigosan-full.jpg",
  toshikoshi: "/photos/month-toshikoshi.jpg",
  oshogatsu: "/photos/month-oshogatsu.jpg",
  setsubun: "/photos/month-setsubun.jpg",
};

const enEvents = en.school.year.events;
const jaEvents = ja.school.year.events;

const [{ count: existingCount }] = (await sql`
  select count(*)::int as count from school_year_event
`) as { count: number }[];

if (existingCount > 0) {
  console.log("school_year_event already has rows — nothing to seed.");
  process.exit(0);
}

let seeded = 0;
for (let i = 0; i < enEvents.length; i++) {
  const event = enEvents[i];
  const eventJa = jaEvents.find((e) => e.id === event.id);
  await sql`
    insert into school_year_event (
      id, key, month, sort_order,
      title, title_ja, label, label_ja, "when", when_ja,
      description, description_ja, term_ja, gloss, gloss_ja, abbr, abbr_ja,
      photo_url, photo_alt, photo_alt_ja, visible
    )
    values (
      ${crypto.randomUUID()}, ${event.id}, ${event.month}, ${i},
      ${event.title}, ${eventJa?.title ?? null}, ${event.label}, ${eventJa?.label ?? null},
      ${event.when}, ${eventJa?.when ?? null},
      ${event.description}, ${eventJa?.description ?? null}, ${event.termJa},
      ${event.gloss}, ${eventJa?.gloss ?? null}, ${event.abbr}, ${eventJa?.abbr ?? null},
      ${PHOTOS[event.id] ?? null}, ${event.photoAlt}, ${eventJa?.photoAlt ?? null}, true
    )
  `;
  seeded += 1;
}

console.log(`Inserted ${seeded} school year event(s).`);
