import type { GroupStatus } from "@/db/schema";

export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  meeting: "Meeting",
  paused: "Paused",
  cancelled: "Discontinued",
};

export const GROUP_STATUS_OPTIONS: { value: GroupStatus; label: string }[] = [
  { value: "meeting", label: "Meeting normally" },
  { value: "paused", label: "Paused — temporarily not meeting" },
  { value: "cancelled", label: "Discontinued — no longer offered" },
];
