import type { UserRole } from "@/db/schema";
import { initialsFrom, ROLE_LABELS } from "@/lib/format";

export function AdminUserIdentity({
  user,
}: {
  user: { name: string | null; email: string | null; role: UserRole };
}) {
  const displayName = user.name?.trim() || user.email || "Volunteer";

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky/40 bg-white/10 font-display text-xs font-semibold text-white">
        {initialsFrom(user)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">
          {displayName}
        </span>
        <span className="block truncate text-xs text-sky">
          {ROLE_LABELS[user.role]}
        </span>
      </span>
    </div>
  );
}
