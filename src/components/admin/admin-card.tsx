import Link from "next/link";
import type { ReactNode } from "react";

export const adminPanel = "rounded-xl border border-line bg-white";

export function AdminCard({ children }: { children: ReactNode }) {
  return <section className={`${adminPanel} p-6`}>{children}</section>;
}

export function AdminStep({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
      {n}
    </span>
  );
}

export function AdminCardHeading({
  step,
  tag,
  children,
}: {
  step?: number;
  tag?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {step !== undefined && <AdminStep n={step} />}
      <h2 className="font-semibold text-ink">
        {children} {tag}
      </h2>
    </div>
  );
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
      className={`${adminPanel} block p-4 transition hover:border-indigo/50 hover:shadow-sm`}
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
    <div className={`${adminPanel} mt-10 p-10 text-center`}>
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mt-2 text-stone">{children}</p>
    </div>
  );
}
