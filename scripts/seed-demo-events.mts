// Fills the events calendar with a year of demo activity so the board can see
// the site with something in it. Rows are matched by slug, so it is safe to
// re-run, and `--clear` takes them back out again.
import { existsSync } from "node:fs";
import path from "node:path";
import type { DemoEvent } from "./demo-events.mts";
import { CENTER, DEMO_EVENTS, RETIRED_SLUGS, TITLE_PREFIX } from "./demo-events.mts";
import {
  DEMO_TITLE_PREFIXES,
  dropBlobs,
  makeFlyerUploader,
  requireDatabaseTarget,
  toWallClock,
  type FlyerRow,
} from "./seed-shared.mts";

type Options = { clear: boolean; flyerDir: string; force?: string };

const args = process.argv.slice(2);
const options: Options = {
  clear: args.includes("--clear"),
  flyerDir:
    args.find((a) => a.startsWith("--flyers="))?.slice("--flyers=".length) ??
    "materials",
  force: args.find((a) => a.startsWith("--force="))?.slice("--force=".length),
};

const { sql, host: targetHost } = requireDatabaseTarget(
  options.force,
  "demo events"
);

const slugs = DEMO_EVENTS.map((event) => event.slug);
const demoTitles = DEMO_TITLE_PREFIXES.map((prefix) => `${prefix}%`);
const uploadFlyer = makeFlyerUploader(options.flyerDir);

if (options.clear) {
  const removed: FlyerRow[] = await sql`
    delete from event
    where slug = any(${[...slugs, ...RETIRED_SLUGS]}) and title like any(${demoTitles})
    returning slug, flyer_url, flyer_download_url
  `;
  await dropBlobs(removed);
  console.log(`Removed ${removed.length} demo event(s).`);
  process.exit(0);
}

const retired: FlyerRow[] = await sql`
  delete from event
  where slug = any(${RETIRED_SLUGS}) and title like any(${demoTitles})
  returning slug, flyer_url, flyer_download_url
`;
if (retired.length) {
  await dropBlobs(retired);
  console.log(`Removed ${retired.length} replaced demo event(s).`);
}

function flyerFor(event: DemoEvent): string | null {
  if (event.noFlyer) return null;
  // The real flyers live in the gitignored materials/, so a fresh clone won't
  // have them — fall through to the stand-in rather than dying on a bad path.
  if (event.flyer && existsSync(path.join(options.flyerDir, event.flyer))) {
    return event.flyer;
  }
  if (event.flyer) {
    console.warn(`  ${event.flyer} not found in ${options.flyerDir}, drawing one`);
  }
  const drawn = path.join("demo-flyers", `${event.slug}.pdf`);
  return existsSync(path.join(options.flyerDir, drawn)) ? drawn : null;
}

let written = 0;
const skipped: string[] = [];
for (const event of DEMO_EVENTS) {
  const name = flyerFor(event);
  const flyer = name ? await uploadFlyer(name) : null;
  const rows: { slug?: unknown }[] = await sql`
    insert into event (
      id, slug, title, description, flyer_url, flyer_download_url, signup_url,
      start_at, end_at, repeat, repeat_until, location, status
    )
    values (
      ${crypto.randomUUID()},
      ${event.slug},
      ${TITLE_PREFIX + event.title},
      ${event.description ?? null},
      ${flyer?.imageUrl ?? null},
      ${flyer?.downloadUrl ?? null},
      ${event.signup ?? null},
      ${toWallClock(event.date, event.start)},
      ${event.end ? toWallClock(event.date, event.end) : null},
      ${event.repeat ?? "none"},
      ${event.until ? toWallClock(event.until) : null},
      ${event.location ?? CENTER},
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
      repeat = excluded.repeat,
      repeat_until = excluded.repeat_until,
      location = excluded.location,
      status = excluded.status,
      updated_at = now()
    where event.title like any(${demoTitles})
    returning slug
  `;
  if (rows.length) written += 1;
  else skipped.push(event.slug);
}

if (skipped.length) {
  console.log(
    `Left ${skipped.length} row(s) alone — the title no longer starts with ` +
      `"${TITLE_PREFIX}": ${skipped.join(", ")}`
  );
}
console.log(
  `Seeded ${written} demo event(s). Re-run with --force=${targetHost} --clear to remove them.`
);
