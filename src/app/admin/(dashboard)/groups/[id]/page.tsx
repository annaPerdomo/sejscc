import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { GroupForm } from "../group-form";
import { deleteGroup } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [group] = await db.select().from(groups).where(eq(groups.id, id));
  if (!group) notFound();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Edit Group</h1>
          <p className="mt-1 text-stone">
            {group.active
              ? group.status === "meeting"
                ? "This group is live on the website."
                : `This group is live on the website, marked as ${group.status}.`
              : "This group is hidden — visitors can’t see it."}
          </p>
        </div>
        <ConfirmDeleteButton
          action={deleteGroup.bind(null, group.id)}
          label="Delete group"
          prompt="Delete this group for good?"
          redirectTo="/admin/groups"
        />
      </div>
      <GroupForm group={group} />
    </div>
  );
}
