import { asc } from "drizzle-orm";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminEmptyState } from "@/components/admin/admin-card";
import { GroupList } from "./group-list";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const allGroups = await db
    .select()
    .from(groups)
    .orderBy(asc(groups.sortOrder), asc(groups.name));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Groups</h1>
          <p className="mt-1 text-stone">
            Add and edit the community groups shown on the website.
          </p>
        </div>
        <AdminButtonLink href="/admin/groups/new">
          + Add New Group
        </AdminButtonLink>
      </div>

      {allGroups.length === 0 ? (
        <AdminEmptyState title="No groups yet">
          Click “Add New Group” to list a community group — all you need is its
          name.
        </AdminEmptyState>
      ) : (
        <GroupList groups={allGroups} />
      )}
    </div>
  );
}
