import { neon } from "@neondatabase/serverless";
import en from "../src/dictionaries/en.json" with { type: "json" };
import ja from "../src/dictionaries/ja.json" with { type: "json" };

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Mirrors `schoolPhotos.levels` in src/lib/photos.ts, which is keyed by
// position against `school.classes.levels` in the dictionaries.
const PHOTOS = [
  "/photos/level-kindergarten-2025.jpg",
  "/photos/level-beginning-2025.jpg",
  "/photos/level-elementary-2025.jpg",
  "/photos/level-intermediate-2025.jpg",
  "/photos/level-advanced-2025.jpg",
  "/photos/level-adult-online.jpg",
  "/photos/level-shuji.jpg",
];

function statusFor(freeText: string): "open" | "unavailable" {
  return freeText ? "unavailable" : "open";
}

const enLevels = en.school.classes.levels;
const jaLevels = ja.school.classes.levels;

const [{ count: existingCount }] = (await sql`
  select count(*)::int as count from school_level
`) as { count: number }[];

if (existingCount > 0) {
  const rows = (await sql`
    select id, sort_order from school_level where kanji is null
  `) as { id: string; sort_order: number }[];

  let backfilled = 0;
  for (const row of rows) {
    const level = enLevels[row.sort_order];
    if (!level) continue;
    await sql`
      update school_level
      set name_ja = ${jaLevels[row.sort_order]?.name ?? null}, kanji = ${level.nameJa ?? null}
      where id = ${row.id}
    `;
    backfilled += 1;
  }
  console.log(`Backfilled ${backfilled} row(s) missing a plaque kanji.`);
  process.exit(0);
}

let seeded = 0;
for (let i = 0; i < enLevels.length; i++) {
  const level = enLevels[i];
  const levelJa = jaLevels[i];
  await sql`
    insert into school_level (
      id, sort_order, name, name_ja, kanji, summary, summary_ja, status,
      description, description_ja, points, points_ja,
      photo_url, photo_alt, photo_alt_ja, visible
    )
    values (
      ${crypto.randomUUID()}, ${i}, ${level.name}, ${levelJa?.name ?? null}, ${level.nameJa ?? null},
      ${level.summary}, ${levelJa?.summary ?? null}, ${statusFor(level.status)},
      ${level.description}, ${levelJa?.description ?? null},
      ${level.points}, ${levelJa?.points ?? null},
      ${PHOTOS[i] ?? null}, ${level.photoAlt}, ${levelJa?.photoAlt ?? null}, true
    )
  `;
  seeded += 1;
}

console.log(`Inserted ${seeded} school level(s).`);
