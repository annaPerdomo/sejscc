import Link from "next/link";
import type { ReactNode } from "react";

export function AdminBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center font-display text-base font-semibold text-indigo-deep hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-deep"
    >
      {children}
    </Link>
  );
}
