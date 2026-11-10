import type { JapaneseUpdate } from "@/lib/japanese-drafts";

export const SIGN_IN_AGAIN_MESSAGE =
  "Your sign-in has expired. Your changes are still here — sign in again, then come back and press Save.";

const JAPANESE_NOTES: Record<JapaneseUpdate, string> = {
  rewritten: "The Japanese page was rewritten to match.",
  limit:
    "The Japanese has been rewritten as many times as it can be today, so the Japanese page shows your English for now. Save it again tomorrow to get the Japanese.",
  unavailable:
    "The Japanese couldn't be written just now, so the Japanese page shows your English for now. Save it again later to try once more.",
};

export function withJapaneseNote(message: string, update: JapaneseUpdate | null): string {
  return update ? `${message} ${JAPANESE_NOTES[update]}` : message;
}

export const ENGLISH_EDIT_NOTE = "When you save, the Japanese page is rewritten to match. It takes a few seconds.";

export const JAPANESE_EDIT_NOTE =
  "This Japanese is written for you from the English. Change it only to fix the Japanese. Your fix stays until the English changes.";
