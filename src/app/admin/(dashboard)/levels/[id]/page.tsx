import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { schoolLevels } from "@/db/schema";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteSchoolLevel } from "../actions";
import { LevelForm } from "../level-form";

export const dynamic = "force-dynamic";

export default async function EditLevelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [level] = await db.select().from(schoolLevels).where(eq(schoolLevels.id, id));
  if (!level) notFound();

  return (
    <AdminPageWidth>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Edit Class Level</h1>
          <p className="mt-1 text-stone">
            {level.visible
              ? "This class level is showing on the school page."
              : "This class level is hidden — visitors can’t see it."}
          </p>
        </div>
        <ConfirmDeleteButton
          action={deleteSchoolLevel.bind(null, level.id)}
          label="Remove this class level"
          prompt={`Remove ${level.name}? This can't be undone.`}
          redirectTo="/admin/levels"
        />
      </div>
      <LevelForm level={level} />
    </AdminPageWidth>
  );
}
