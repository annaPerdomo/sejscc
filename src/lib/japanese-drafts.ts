import { generateText, jsonSchema, Output } from "ai";
import { count, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { japaneseDrafts } from "@/db/schema";
import { AdminError } from "@/lib/action-result";

const TRANSLATION_MODEL = "anthropic/claude-sonnet-5.5";
const TRANSLATION_TIMEOUT_MS = 20_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_LIMIT = 150;

const INSTRUCTIONS = `You translate English copy from the website of the Southeast Japanese School & Community Center in Norwalk, California into natural Japanese for its Japanese-language pages. The readers are Japanese families, grandparents and community members.

- Write the way a warm, polite Japanese community organization writes to families: です・ます調, plain and friendly, never stiff or overly formal. Headings and short labels may be noun phrases.
- The center is サウスイースト日本語学園・コミュニティセンター and the school is サウスイースト日本語学園. Never write "Southeast" as 東南.
- Keep people's names, addresses, email addresses, web addresses, phone numbers, prices and anything inside curly braces, like {title}, exactly as written.
- Translate only what is there. Never add greetings, explanations or details the English doesn't say.
- English that already uses Japanese words (undokai, obon, 運動会) means the usual Japanese word for them.
- Stay within the character limit you are given.`;

type Translation = { japanese: string };

const TRANSLATION_SCHEMA = jsonSchema<Translation>({
  type: "object",
  properties: { japanese: { type: "string" } },
  required: ["japanese"],
  additionalProperties: false,
});

export type JapaneseUpdate = "rewritten" | "limit" | "unavailable";

export type FollowedJapanese = { japanese: string | null; update: JapaneseUpdate | null };

function placeholders(text: string): string {
  return (text.match(/\{\w+\}/g) ?? []).sort().join();
}

// The row is claimed before the model runs, so a request that fails still
// counts toward the limit.
async function claimDraft(): Promise<boolean> {
  const dayAgo = new Date(Date.now() - DAY_MS);
  const [{ made }] = await db
    .select({ made: count() })
    .from(japaneseDrafts)
    .where(gte(japaneseDrafts.createdAt, dayAgo));
  if (made >= DAILY_LIMIT) return false;
  await db.insert(japaneseDrafts).values({});
  await db.delete(japaneseDrafts).where(lt(japaneseDrafts.createdAt, dayAgo));
  return true;
}

export async function draftJapanese(english: string, max: number): Promise<FollowedJapanese> {
  try {
    if (!(await claimDraft())) return { japanese: null, update: "limit" };
    const { output } = await generateText({
      model: TRANSLATION_MODEL,
      system: INSTRUCTIONS,
      prompt: `Character limit: ${max}\n\nEnglish:\n${english}`,
      output: Output.object({ schema: TRANSLATION_SCHEMA }),
      abortSignal: AbortSignal.timeout(TRANSLATION_TIMEOUT_MS),
    });
    const japanese = output.japanese.trim();
    const usable =
      japanese && japanese.length <= max && placeholders(japanese) === placeholders(english);
    return usable ? { japanese, update: "rewritten" } : { japanese: null, update: "unavailable" };
  } catch (error) {
    console.error("Japanese draft failed:", error);
    return { japanese: null, update: "unavailable" };
  }
}

export type JapanesePair = {
  english: string | null;
  japanese: string | null;
  max: number;
  /** What's stored now; leave out for a record that's being created. */
  saved?: { english: string | null; japanese: string | null };
};

// Untouched Japanese for changed English is rewritten; if that fails it's cleared
// so the Japanese pages fall back to the English instead of saying something stale.
export async function japaneseFollowingEnglish(pair: JapanesePair): Promise<FollowedJapanese> {
  const { english, japanese, saved } = pair;
  const englishChanged = saved !== undefined && english !== saved.english;
  const japaneseTouched = saved === undefined || japanese !== saved.japanese;

  if (!english) return { japanese: englishChanged && !japaneseTouched ? null : japanese, update: null };
  if (japanese && (!englishChanged || japaneseTouched)) return { japanese, update: null };
  return draftJapanese(english, pair.max);
}

export async function followEnglishOrRestore(
  pair: JapanesePair,
  restore: string | null | undefined
): Promise<FollowedJapanese> {
  if (restore === undefined) return japaneseFollowingEnglish(pair);
  const japanese = restore?.trim() || null;
  if (japanese && japanese.length > pair.max) {
    throw new AdminError(`The Japanese is too long — please keep it under ${pair.max} characters.`);
  }
  return { japanese, update: null };
}

const UPDATE_RANK: Record<JapaneseUpdate, number> = { rewritten: 1, unavailable: 2, limit: 3 };

export function mostNotableUpdate(updates: (JapaneseUpdate | null)[]): JapaneseUpdate | null {
  return updates.reduce<JapaneseUpdate | null>(
    (notable, update) =>
      update && (!notable || UPDATE_RANK[update] > UPDATE_RANK[notable]) ? update : notable,
    null
  );
}
