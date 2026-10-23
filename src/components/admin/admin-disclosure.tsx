import type { ReactNode } from "react";

export function AdminDisclosure({
  summary,
  className = "",
  children,
}: {
  summary: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details className={`admin-disclosure group rounded-xl border border-line bg-white ${className}`}>
      <summary className="flex min-h-14 items-center justify-between gap-4 px-5 py-3 font-display text-lg text-ink">
        {summary}
        <span className="shrink-0 text-base font-semibold text-indigo-deep">
          <span className="group-open:hidden">Show</span>
          <span className="hidden group-open:inline">Hide</span>
        </span>
      </summary>
      <div className="border-t border-line px-5 pb-5">{children}</div>
    </details>
  );
}
