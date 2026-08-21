import type { ReactNode } from "react";
import { AdminCardLink } from "./admin-card";

export function AdminListRow({
  href,
  thumbnail,
  title,
  subtitle,
  badge,
}: {
  href: string;
  thumbnail: ReactNode;
  title: string;
  subtitle?: ReactNode;
  badge: ReactNode;
}) {
  return (
    <AdminCardLink href={href}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-mist">
          {thumbnail}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{title}</p>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-stone">{subtitle}</p>
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
          {badge}
          <span className="text-sm font-semibold text-indigo">Edit →</span>
        </div>
      </div>
    </AdminCardLink>
  );
}
