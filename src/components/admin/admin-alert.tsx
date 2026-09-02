import type { ReactNode } from "react";

export function AdminAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-indigo/40 bg-indigo/5 px-4 py-3 text-sm text-indigo-deep"
    >
      {children}
    </p>
  );
}

const listMissing = new Intl.ListFormat("en", { type: "conjunction" });

export function AdminRequirements({
  missing,
  action,
}: {
  missing: string[];
  action: string;
}) {
  return (
    <p className="rounded-lg border border-line bg-mist px-4 py-3 text-sm text-ink-soft">
      Add{" "}
      <strong className="font-semibold text-ink">
        {listMissing.format(missing)}
      </strong>{" "}
      to {action}.
    </p>
  );
}
