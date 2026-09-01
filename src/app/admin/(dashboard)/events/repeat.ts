import type { EventRepeat } from "@/db/schema";
import {
  describeRepeat,
  type RepeatingEvent,
  type RepeatPhrases,
} from "@/lib/recurrence";

export const REPEAT_OPTIONS: { value: EventRepeat; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every other week" },
  { value: "monthly", label: "Every month" },
];

// Word for word what `events.repeat` says in en.json — change one, change both.
// Copied rather than imported: the form would ship the whole dictionary.
const PHRASES: RepeatPhrases = {
  weekly: "Every {weekday}",
  biweekly: "Every other {weekday}",
  monthly: "{ordinal} {weekday} of the month",
  ordinals: ["First", "Second", "Third", "Fourth", "Fifth"],
  until: "{schedule}, through {date}",
};

export function repeatSummary(event: RepeatingEvent) {
  return describeRepeat(event, PHRASES);
}
