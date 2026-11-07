import type { ReactNode, SyntheticEvent } from "react";

export function AdminDisclosure({
  summary,
  className = "",
  defaultOpen = false,
  onToggle,
  children,
}: {
  summary: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  onToggle?: (event: SyntheticEvent<HTMLDetailsElement>) => void;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen || undefined}
      onToggle={onToggle}
      className={`admin-disclosure group rounded-xl border border-line bg-white ${className}`}
    >
      <summary className="flex min-h-14 items-center justify-between gap-4 px-5 py-3 font-display text-lg text-ink">
        {summary}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 shrink-0 text-indigo-deep transition-transform duration-200 group-open:rotate-180"
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="border-t border-line px-5 pb-5">{children}</div>
    </details>
  );
}
