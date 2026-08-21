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
