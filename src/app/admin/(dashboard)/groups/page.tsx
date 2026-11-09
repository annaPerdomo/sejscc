import { asc } from "drizzle-orm";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminEmptyState } from "@/components/admin/admin-card";
import { GroupList } from "./group-list";
import { AdminPageWidth } from "@/components/admin/admin-page-width";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const allGroups = await db
    .select()
    .from(groups)
    .orderBy(asc(groups.sortOrder), asc(groups.name));

  return (
    <AdminPageWidth>
      <AdminBackLink href="/admin/pages/groups">← Back to the Sports &amp; Classes page</AdminBackLink>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Sports &amp; Classes</h1>
          <p className="mt-1 text-stone">
            Add a sport or class, change its order, or hide one from the website.
          </p>
        </div>
        <AdminButtonLink href="/admin/groups/new">
          + Add a sport or class
        </AdminButtonLink>
      </div>

      {allGroups.length === 0 ? (
        <AdminEmptyState title="No sports or classes yet">
          Click “Add a sport or class” to list one — all you need is its name.
        </AdminEmptyState>
      ) : (
        <GroupList groups={allGroups} />
      )}
    </AdminPageWidth>
  );
}
