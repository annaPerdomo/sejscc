import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { del, put } from "@vercel/blob";
import { TITLE_PREFIX } from "./demo-events.mts";

export const DEMO_TITLE_PREFIXES: readonly string[] = [TITLE_PREFIX, "[TEST] "];

export type FlyerRow = { flyer_url?: unknown; flyer_download_url?: unknown };
export type FlyerUrls = { imageUrl: string; downloadUrl: string };

export function requireDatabaseTarget(
  force: string | undefined,
  what: string
): { sql: NeonQueryFunction<false, false>; host: string } {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
    process.exit(1);
  }

  let host: string;
  try {
    ({ host } = new URL(process.env.DATABASE_URL));
  } catch {
    console.error("DATABASE_URL is not a valid connection URL.");
    process.exit(1);
  }

  if (force !== host) {
    console.error(
      `This would write ${what} to ${host}, and upload flyers to this\n` +
        `project's Vercel Blob store. Re-run with --force=${host} if that is right.`
    );
    process.exit(1);
  }

  return { sql: neon(process.env.DATABASE_URL), host };
}

export function toWallClock(date: string, time?: string): Date | null {
  return date ? new Date(`${date}T${time ?? "00:00"}:00Z`) : null;
}

export function pdfFirstPageToPng(file: string): string {
  const out = mkdtempSync(path.join(tmpdir(), "sejscc-flyer-"));
  execFileSync("qlmanage", ["-t", "-s", "1600", "-o", out, file], {
    stdio: "ignore",
  });
  return path.join(out, `${path.basename(file)}.png`);
}

export function isHttpsUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("https://");
}

export async function dropBlobs(rows: FlyerRow[]): Promise<void> {
  const urls = rows
    .flatMap((row) => [row.flyer_url, row.flyer_download_url])
    .filter(isHttpsUrl);
  if (!urls.length) return;
  await del([...new Set(urls)]);
  console.log(`Deleted ${new Set(urls).size} flyer blob(s).`);
}

export function makeFlyerUploader(
  dir: string
): (name: string) => Promise<FlyerUrls> {
  const cache = new Map<string, FlyerUrls>();

  async function upload(file: string, name: string): Promise<string> {
    const { url } = await put(`flyers/${name}`, await readFile(file), {
      access: "public",
      addRandomSuffix: true,
    });
    return url;
  }

  return async function uploadFlyer(name: string): Promise<FlyerUrls> {
    const cached = cache.get(name);
    if (cached) return cached;

    const file = path.join(dir, name);
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

    cache.set(name, urls);
    console.log(`  uploaded ${name}`);
    return urls;
  };
}
