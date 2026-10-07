// Only groups without photos are touched, so a board member's uploads are
// never replaced; `--clear` removes only the photos under DEMO_PREFIX.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { del, put } from "@vercel/blob";

const DEMO_PREFIX = "groups/demo/";

// Keyed by group name as it appears in the admin.
const PHOTOS: Record<string, string[]> = {
  "Ballroom Dancing": [
    "groups-ballroom-1.jpg",
    "groups-ballroom-2.jpg",
    "groups-ballroom-3.jpg",
    "groups-ballroom-4.jpg",
    "groups-ballroom-5.jpg",
    "groups-ballroom-6.jpg",
  ],
  "Hawaiian Dance": [
    "groups-hero-2.jpg",
    "groups-hula-1.jpg",
    "groups-hula-2.jpg",
    "groups-hula-3.jpg",
    "groups-hula-4.jpg",
    "groups-hula-5.jpg",
  ],
  Ikebana: [
    "groups-ikebana-1.jpg",
    "groups-ikebana-2.jpg",
    "groups-ikebana-3.jpg",
    "groups-ikebana-4.jpg",
  ],
  "Japanese Dance": [
    "groups-japanese-dance-1.jpg",
    "groups-japanese-dance-2.jpg",
    "groups-japanese-dance-3.jpg",
    "groups-japanese-dance-4.jpg",
    "groups-japanese-dance-5.jpg",
    "groups-japanese-dance-6.jpg",
  ],
  Kendo: [
    "groups-kendo-1.jpg",
    "groups-kendo-2.jpg",
    "groups-kendo-3.jpg",
    "groups-kendo-4.jpg",
    "history-1965-kendo.jpg",
  ],
  "Koto Class": [
    "groups-koto-1.jpg",
    "groups-koto-2.jpg",
    "month-jugyosankan.jpg",
  ],
  "Nikkei Seniors": [
    "groups-seniors-1.jpg",
    "groups-seniors-2.jpg",
    "groups-seniors-3.jpg",
    "groups-seniors-4.jpg",
    "groups-seniors-5.jpg",
  ],
  "Norwalk Judo": [
    "groups-judo-1.jpg",
    "groups-judo-2.jpg",
    "groups-judo-3.jpg",
    "groups-judo-4.jpg",
  ],
  "Norwalk Youth Sports (NYS)": [
    "groups-nys-1.jpg",
    "groups-nys-2.jpg",
    "groups-nys-3.jpg",
    "groups-nys-4.jpg",
    "groups-nys-5.jpg",
    "groups-nys-6.jpg",
  ],
  Taiko: [
    "groups-taiko-1.jpg",
    "groups-taiko-2.jpg",
    "groups-taiko-3.jpg",
    "groups-taiko-4.jpg",
    "groups-taiko-5.jpg",
  ],
  Ukulele: [
    "groups-ukulele-1.jpg",
    "groups-ukulele-2.jpg",
    "groups-ukulele-3.jpg",
    "groups-ukulele-4.jpg",
  ],
  "Shuji or Shodo": ["level-shuji.jpg"],
};

const args = process.argv.slice(2);
const clear = args.includes("--clear");
const force = args
  .find((a) => a.startsWith("--force="))
  ?.slice("--force=".length);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
  process.exit(1);
}

// Never print the URL itself on failure: it carries the password.
let targetHost: string;
try {
  ({ host: targetHost } = new URL(process.env.DATABASE_URL));
} catch {
  console.error("DATABASE_URL is not a valid connection URL.");
  process.exit(1);
}

if (force !== targetHost) {
  console.error(
    `This would change group photos on ${targetHost}, and upload to this\n` +
      `project's Vercel Blob store. Re-run with --force=${targetHost} if that is right.`,
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

type Row = { id: string; name: string; photo_urls: string[] };

function isDemoUrl(url: string) {
  return new URL(url).pathname.includes(`/${DEMO_PREFIX}`);
}

const rows = (await sql`select id, name, photo_urls from "group"`) as Row[];

if (clear) {
  let removed = 0;
  for (const row of rows) {
    const demo = row.photo_urls.filter(isDemoUrl);
    if (demo.length === 0) continue;
    const kept = row.photo_urls.filter((url) => !isDemoUrl(url));
    await sql`update "group" set photo_urls = ${kept} where id = ${row.id}`;
    await del(demo);
    removed += demo.length;
  }
  console.log(`Removed ${removed} demo photo(s).`);
  process.exit(0);
}

const uploaded = new Map<string, string>();
async function uploadPhoto(file: string) {
  const cached = uploaded.get(file);
  if (cached) return cached;
  const { url } = await put(
    `${DEMO_PREFIX}${file}`,
    await readFile(path.join("public", "photos", file)),
    { access: "public", addRandomSuffix: true },
  );
  uploaded.set(file, url);
  return url;
}

let seeded = 0;
for (const row of rows) {
  const files = PHOTOS[row.name];
  if (!files) {
    console.log(`No demo photos listed for "${row.name}" — skipped.`);
    continue;
  }
  if (row.photo_urls.length > 0) {
    console.log(`"${row.name}" already has photos — left alone.`);
    continue;
  }
  const urls: string[] = [];
  for (const file of files) urls.push(await uploadPhoto(file));
  await sql`update "group" set photo_urls = ${urls} where id = ${row.id}`;
  seeded += 1;
}
console.log(`Added photos to ${seeded} group(s).`);
