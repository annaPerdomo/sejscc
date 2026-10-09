import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminEmptyState } from "@/components/admin/admin-card";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getAllSchoolLevels } from "@/lib/school-levels";
import { LevelList } from "./level-list";

export const dynamic = "force-dynamic";

export default async function AdminLevelsPage() {
  const levels = await getAllSchoolLevels();

  return (
    <AdminPageWidth>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Class Levels</h1>
          <p className="mt-1 text-stone">
            The classes shown on the Japanese School page, in this order.
          </p>
        </div>
        <AdminButtonLink href="/admin/levels/new">
          + Add a class level
        </AdminButtonLink>
      </div>

      {levels.length === 0 ? (
        <AdminEmptyState title="No class levels yet">
          Click “+ Add a class level” to add the first one.
        </AdminEmptyState>
      ) : (
        <LevelList levels={levels} />
      )}
    </AdminPageWidth>
  );
}
