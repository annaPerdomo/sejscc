// Fills the events calendar with a year of demo activity so the board can see
// the site with something in it. Rows are matched by slug, so it is safe to
// re-run, and `--clear` takes them back out again.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { del, put } from "@vercel/blob";
import {
  CENTER,
  DEMO_EVENTS,
  RETIRED_SLUGS,
  TITLE_PREFIX,
} from "./demo-events.mjs";

const args = process.argv.slice(2);
const clear = args.includes("--clear");
const flyerDir =
  args.find((a) => a.startsWith("--flyers="))?.slice("--flyers=".length) ??
  "materials";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
  process.exit(1);
}

// Never print the URL itself on failure: it carries the password, and an
// invalid one would otherwise reach the terminal through the parse error.
let targetHost;
try {
  ({ host: targetHost } = new URL(process.env.DATABASE_URL));
} catch {
  console.error("DATABASE_URL is not a valid connection URL.");
  process.exit(1);
}

// .env.local can point anywhere, including the live database. Confirming means
// retyping the host, so an operator can't wave through one they didn't read —
// Neon branch hostnames differ by a few characters.
if (args.find((a) => a.startsWith("--force="))?.slice(8) !== targetHost) {
  console.error(
    `This would write demo events to ${targetHost}, and upload flyers to this\n` +
      `project's Vercel Blob store. Re-run with --force=${targetHost} if that is right.`
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const slugs = DEMO_EVENTS.map((event) => event.slug);
const demoTitle = `${TITLE_PREFIX}%`;

// Uploads use addRandomSuffix, so a row's blobs are unreachable once its row is
// gone. Dropping them here is what keeps re-runs from filling the store.
async function dropBlobs(rows) {
  const urls = rows
    .flatMap((row) => [row.flyer_url, row.flyer_download_url])
    .filter((url) => url && url.startsWith("https://"));
  if (!urls.length) return;
  await del([...new Set(urls)]);
  console.log(`Deleted ${new Set(urls).size} flyer blob(s).`);
}

if (clear) {
  const removed = await sql`
    delete from event
    where slug = any(${[...slugs, ...RETIRED_SLUGS]}) and title like ${demoTitle}
    returning slug, flyer_url, flyer_download_url
  `;
  await dropBlobs(removed);
  console.log(`Removed ${removed.length} demo event(s).`);
  process.exit(0);
}

const retired = await sql`
  delete from event
  where slug = any(${RETIRED_SLUGS}) and title like ${demoTitle}
  returning slug, flyer_url, flyer_download_url
`;
if (retired.length) {
  await dropBlobs(retired);
  console.log(`Removed ${retired.length} replaced demo event(s).`);
}

// The storage convention: LA wall clock behind a fake UTC marker (format.ts).
function toWallClock(date, time) {
  return date ? new Date(`${date}T${time ?? "00:00"}:00Z`) : null;
}

const flyerCache = new Map();

async function upload(file, name) {
  const { url } = await put(`flyers/${name}`, await readFile(file), {
    access: "public",
    addRandomSuffix: true,
  });
  return url;
}

// The site renders the flyer as an image, so a PDF needs a first-page preview
// too — what src/lib/pdf-preview.ts does in the browser. qlmanage is macOS-only.
function pdfFirstPageToPng(file) {
  const out = mkdtempSync(path.join(tmpdir(), "sejscc-flyer-"));
  execFileSync("qlmanage", ["-t", "-s", "1600", "-o", out, file], {
    stdio: "ignore",
  });
  return path.join(out, `${path.basename(file)}.png`);
}

/** @returns {Promise<{ imageUrl: string, downloadUrl: string }>} */
async function uploadFlyer(name) {
  const cached = flyerCache.get(name);
  if (cached) return cached;

  const file = path.join(flyerDir, name);
  const urls = name.toLowerCase().endsWith(".pdf")
    ? {
        imageUrl: await upload(
          pdfFirstPageToPng(file),
          name.replace(/\.pdf$/i, ".png")
        ),
        downloadUrl: await upload(file, name),
      }
    : await upload(file, name).then((url) => ({
        imageUrl: url,
        downloadUrl: url,
      }));

  flyerCache.set(name, urls);
  console.log(`  uploaded ${name}`);
  return urls;
}

function flyerFor(event) {
  if (event.noFlyer) return null;
  // The real flyers live in the gitignored materials/, so a fresh clone won't
  // have them — fall through to the stand-in rather than dying on a bad path.
  if (event.flyer && existsSync(path.join(flyerDir, event.flyer))) {
    return event.flyer;
  }
  if (event.flyer) {
    console.warn(`  ${event.flyer} not found in ${flyerDir}, drawing one`);
  }
  const drawn = path.join("demo-flyers", `${event.slug}.pdf`);
  return existsSync(path.join(flyerDir, drawn)) ? drawn : null;
}

let written = 0;
const skipped = [];
for (const event of DEMO_EVENTS) {
  const name = flyerFor(event);
  const flyer = name ? await uploadFlyer(name) : null;
  const rows = await sql`
    insert into event (
      id, slug, title, description, flyer_url, flyer_download_url, signup_url,
      start_at, end_at, repeat, repeat_until, location, status
    )
    values (
      ${crypto.randomUUID()},
      ${event.slug},
      ${TITLE_PREFIX + event.title},
      ${event.description},
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
    where event.title like ${demoTitle}
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
