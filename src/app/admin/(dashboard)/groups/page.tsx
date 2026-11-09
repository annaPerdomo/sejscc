import { asc } from "drizzle-orm";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { AdminActionTiles } from "@/components/admin/admin-action-tile";
import { BallIcon, PencilIcon } from "@/components/admin/admin-icons";
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
      <h1 className="font-display text-3xl text-ink">Sports &amp; Classes</h1>
      <p className="mt-1 text-lg text-stone">
        Add a sport or class, or change the words and photos on the Sports &amp; Classes page.
      </p>
      <div className="mt-6">
        <AdminActionTiles
          actions={[
            {
              href: "/admin/groups/new",
              label: "Add a sport or class",
              detail: "Put a new group on the list.",
              icon: BallIcon,
              surface: "from-lilac",
              ring: "ring-lilac",
            },
            {
              href: "/admin/pages/groups",
              label: "Change the Sports & Classes page",
              detail: "Tap any words or photos on the website to change them.",
              icon: PencilIcon,
              surface: "from-azure",
              ring: "ring-azure",
            },
          ]}
        />
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
