import type { ReactNode } from "react";

const TONE_CLASS = {
  info: "border-indigo/40 bg-indigo/5 text-indigo-deep",
  warning: "border-gold bg-butter text-ink",
};

export function AdminAlert({
  role = "alert",
  tone = "info",
  children,
}: {
  role?: "alert" | "note";
  tone?: keyof typeof TONE_CLASS;
  children: ReactNode;
}) {
  return (
    <p role={role} className={`rounded-lg border px-4 py-3 text-sm ${TONE_CLASS[tone]}`}>
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
