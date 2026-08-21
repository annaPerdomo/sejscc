import Link from "next/link";
import type { ReactNode } from "react";

const panel = "rounded-xl border border-line bg-white";

export function AdminCard({ children }: { children: ReactNode }) {
  return <section className={`${panel} p-6`}>{children}</section>;
}

export function AdminCardLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${panel} block p-4 transition hover:border-indigo/50 hover:shadow-sm`}
    >
      {children}
    </Link>
  );
}

export function AdminEmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={`${panel} mt-10 p-10 text-center`}>
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mt-2 text-stone">{children}</p>
    </div>
  );
}
