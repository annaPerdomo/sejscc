import { existsSync } from "node:fs";
import path from "node:path";
import { del } from "@vercel/blob";
import { CENTER_ADDRESS } from "../src/lib/center.ts";
import { DEMO_EVENTS } from "./demo-events.mts";
import { PAST_EVENTS, REPLACED_DEMO_SLUGS, type PastEvent } from "./past-events.mts";
import {
  DEMO_TITLE_PREFIXES,
  dropBlobs,
  isHttpsUrl,
  makeFlyerUploader,
  requireDatabaseTarget,
  toWallClock,
  type FlyerRow,
  type FlyerUrls,
} from "./seed-shared.mts";

type Options = { clear: boolean; flyerDir: string; force?: string };

const args = process.argv.slice(2);
const options: Options = {
  clear: args.includes("--clear"),
  flyerDir:
    args.find((a) => a.startsWith("--flyers="))?.slice("--flyers=".length) ??
    "materials/past-flyers",
  force: args.find((a) => a.startsWith("--force="))?.slice("--force=".length),
};

const demoSlugs = new Set(DEMO_EVENTS.map((event) => event.slug));
const conflicts = PAST_EVENTS.filter((event) => demoSlugs.has(event.slug)).map(
  (event) => event.slug
);
if (conflicts.length) {
  console.error(
    `These PAST_EVENTS slugs are still in DEMO_EVENTS: ${conflicts.join(", ")}. ` +
      "Remove them from demo-events.mts first."
  );
  process.exit(1);
}

const seen = new Set<string>();
const duplicates = new Set<string>();
for (const event of PAST_EVENTS) {
  if (seen.has(event.slug)) duplicates.add(event.slug);
  seen.add(event.slug);
}
if (duplicates.size) {
  console.error(`Duplicate PAST_EVENTS slugs: ${[...duplicates].join(", ")}.`);
  process.exit(1);
}

const { sql, host: targetHost } = requireDatabaseTarget(
  options.force,
  "the center’s real events"
);

const demoTitles = DEMO_TITLE_PREFIXES.map((prefix) => `${prefix}%`);
const pastSlugs = PAST_EVENTS.map((event) => event.slug);

if (options.clear) {
  const removed: FlyerRow[] = await sql`
    delete from event
    where slug = any(${pastSlugs})
      and created_by_id is null
      and updated_at = created_at
      and not (title like any(${demoTitles}))
    returning slug, flyer_url, flyer_download_url
  `;
  await dropBlobs(removed);
  console.log(`Removed ${removed.length} row(s).`);

  const stillThere: { slug?: unknown }[] = await sql`
    select slug from event where slug = any(${pastSlugs})
  `;
  if (stillThere.length) {
    const slugs = stillThere.map((row) => row.slug);
    console.log(
      `Left ${slugs.length} row(s) alone — they were changed in the admin: ${slugs.join(", ")}`
    );
  }
  process.exit(0);
}

const retired: FlyerRow[] = await sql`
  delete from event
  where slug = any(${[...pastSlugs, ...REPLACED_DEMO_SLUGS]})
    and title like any(${demoTitles})
  returning slug, flyer_url, flyer_download_url
`;
if (retired.length) {
  await dropBlobs(retired);
  console.log(`Removed ${retired.length} replaced demo event(s).`);
}

const uploadFlyer = makeFlyerUploader(options.flyerDir);

async function flyerFor(event: PastEvent): Promise<FlyerUrls | null> {
  if (!event.flyer) return null;
  const file = path.join(options.flyerDir, event.flyer);
  if (!existsSync(file)) {
    console.log(`  ${event.flyer} not found in ${options.flyerDir}, seeding without a flyer`);
    return null;
  }
  return uploadFlyer(event.flyer);
}

let inserted = 0;
let refreshed = 0;
const leftAlone: string[] = [];

for (const event of PAST_EVENTS) {
  const flyer = await flyerFor(event);

  const existingRows: FlyerRow[] = await sql`
    select flyer_url, flyer_download_url from event where slug = ${event.slug}
  `;
  const existing = existingRows[0];

  const rows: { slug?: unknown; inserted?: unknown }[] = await sql`
    insert into event (
      id, slug, title, description, flyer_url, flyer_download_url, signup_url,
      start_at, end_at, repeat, location, status
    )
    values (
      ${crypto.randomUUID()},
      ${event.slug},
      ${event.title},
      ${event.description ?? null},
      ${flyer?.imageUrl ?? null},
      ${flyer?.downloadUrl ?? null},
      ${event.signup ?? null},
      ${toWallClock(event.date, event.start)},
      ${event.end ? toWallClock(event.date, event.end) : null},
      'none',
      ${event.location ?? CENTER_ADDRESS},
      ${event.status ?? "published"}
    )
    on conflict (slug) do update set
      title = excluded.title,
      description = excluded.description,
      flyer_url = excluded.flyer_url,
      flyer_download_url = excluded.flyer_download_url,
      signup_url = excluded.signup_url,
      start_at = excluded.start_at,
      end_at = excluded.end_at,
      location = excluded.location,
      status = excluded.status,
      updated_at = event.created_at
    where event.created_by_id is null
      and event.updated_at = event.created_at
      and not (event.title like any(${demoTitles}))
    returning slug, (xmax = 0) as inserted
  `;

  if (!rows.length) {
    leftAlone.push(event.slug);
    const reused = PAST_EVENTS.some(
      (other) => other !== event && other.flyer === event.flyer
    );
    if (flyer && !reused) {
      await del([...new Set([flyer.imageUrl, flyer.downloadUrl])]);
    }
    continue;
  }

  if (rows[0].inserted === true) {
    inserted += 1;
    continue;
  }

  refreshed += 1;
  if (!existing) continue;

  const oldUrls = [existing.flyer_url, existing.flyer_download_url].filter(isHttpsUrl);
  const newUrls = [flyer?.imageUrl, flyer?.downloadUrl].filter(isHttpsUrl);
  const stale = [...new Set(oldUrls.filter((url) => !newUrls.includes(url)))];
  if (!stale.length) continue;

  const stillReferenced: FlyerRow[] = await sql`
    select flyer_url, flyer_download_url from event
    where flyer_url = any(${stale}) or flyer_download_url = any(${stale})
  `;
  const referenced = new Set(
    stillReferenced.flatMap((row) => [row.flyer_url, row.flyer_download_url]).filter(isHttpsUrl)
  );
  const unreferenced = stale.filter((url) => !referenced.has(url));
  if (unreferenced.length) await del(unreferenced);
}

console.log(`Inserted ${inserted}, refreshed ${refreshed}.`);
if (leftAlone.length) {
  console.log(
    `Left ${leftAlone.length} row(s) alone — they were changed in the admin: ${leftAlone.join(", ")}`
  );
}
console.log(`Re-run with --force=${targetHost} --clear to remove this seeder's own rows.`);
