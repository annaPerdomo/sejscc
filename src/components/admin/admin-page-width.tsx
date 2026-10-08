import type { ReactNode } from "react";

// The layout's <main> has no width constraint; pages opt into one here
// instead of competing with a shared max-w-5xl.
export function AdminPageWidth({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl">{children}</div>;
}
