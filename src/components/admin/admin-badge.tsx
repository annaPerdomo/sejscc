import type { ReactNode } from "react";

const TONE_STYLES = {
  live: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  muted: "bg-gray-100 text-gray-600",
};

export type AdminBadgeTone = keyof typeof TONE_STYLES;

export function AdminBadge({
  tone,
  children,
}: {
  tone: AdminBadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
