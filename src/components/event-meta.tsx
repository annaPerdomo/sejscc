import type { ReactNode } from "react";

const ICONS = {
  calendar: (
    <>
      <rect x="3.25" y="5.5" width="17.5" height="15.25" rx="3.5" />
      <path d="M8 3.25v4M16 3.25v4M3.25 10.5h17.5" />
      <circle cx="12" cy="15.75" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 7v5.3l3.3 1.9" />
    </>
  ),
  repeat: (
    <>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3l2.2 2.2" />
      <path d="M19.5 4.6V9h-4.4" />
      <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3l-2.2-2.2" />
      <path d="M4.5 19.4V15h4.4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21c4.2-4 6.3-7.2 6.3-9.8a6.3 6.3 0 1 0-12.6 0C5.7 13.8 7.8 17 12 21Z" />
      <circle cx="12" cy="11" r="2.4" />
    </>
  ),
} as const;

export type EventIconName = keyof typeof ICONS;

export function EventIcon({ name }: { name: EventIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-px h-4 w-4 shrink-0"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

export function EventMeta({
  icon,
  children,
}: {
  icon: EventIconName;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-start gap-1.5">
      <EventIcon name={icon} />
      <span>{children}</span>
    </span>
  );
}
