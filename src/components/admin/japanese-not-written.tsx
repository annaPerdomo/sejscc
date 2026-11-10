import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminButtonLink, AdminFormActions } from "@/components/admin/admin-button";
import { withJapaneseNote } from "@/lib/admin-messages";
import type { JapaneseUpdate } from "@/lib/japanese-drafts";

export function japaneseWasNotWritten(update: JapaneseUpdate | null): update is "limit" | "unavailable" {
  return update === "limit" || update === "unavailable";
}

export function JapaneseNotWritten({
  update,
  backHref,
}: {
  update: "limit" | "unavailable";
  backHref: string;
}) {
  return (
    <div className="space-y-4">
      <AdminAlert tone="warning">{withJapaneseNote("Saved. Live on the website.", update)}</AdminAlert>
      <AdminFormActions>
        <AdminButtonLink href={backHref}>Back to the list</AdminButtonLink>
      </AdminFormActions>
    </div>
  );
}
