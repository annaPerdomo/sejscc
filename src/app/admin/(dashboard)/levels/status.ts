import type { SchoolLevelStatus } from "@/db/schema";

export const SCHOOL_LEVEL_STATUS_LABELS: Record<SchoolLevelStatus, string> = {
  open: "Open for enrollment",
  unavailable: "Currently unavailable",
};

export const SCHOOL_LEVEL_STATUS_OPTIONS: { value: SchoolLevelStatus; label: string }[] = [
  { value: "open", label: "Open for enrollment" },
  { value: "unavailable", label: "Currently unavailable" },
];
