import type { ComponentType } from "react";
import Link from "next/link";
import type { IconProps } from "@/components/admin/admin-icons";

export type AdminAction = {
  href: string;
  label: string;
  detail: string;
  icon: ComponentType<IconProps>;
  surface: string;
  ring: string;
};

export function AdminActionTile({ href, label, detail, icon: Icon, surface, ring }: AdminAction) {
  return (
    <article
      className={`surface-card surface-card-link relative flex w-full items-center gap-4 overflow-clip bg-gradient-to-br to-white p-5 @xl:flex-col @xl:items-start @xl:gap-5 @xl:p-6 ${surface}`}
    >
      <Icon className="pointer-events-none absolute -right-5 -bottom-5 hidden h-32 w-32 text-ink/5 @xl:block" />
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-deep shadow-md ring-4 ${ring}`}
      >
        <Icon className="h-8 w-8" />
      </span>
      <span className="min-w-0">
        <Link href={href} className="card-stretch block font-display text-xl font-semibold text-ink">
          {label}
        </Link>
        <span className="mt-1 block text-base text-ink-soft">{detail}</span>
      </span>
    </article>
  );
}

export function AdminActionTiles({ actions, className = "" }: { actions: AdminAction[]; className?: string }) {
  const columns = actions.length > 2 ? "@xl:grid-cols-3" : "@xl:grid-cols-2";
  return (
    <div className="@container">
      <ul className={`grid gap-4 ${columns} ${className}`}>
        {actions.map((action) => (
          <li key={action.href} className="flex">
            <AdminActionTile {...action} />
          </li>
        ))}
      </ul>
    </div>
  );
}
