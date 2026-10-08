import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  VOLUNTEER_SECTION_ID,
  boardMembers,
  volunteerRoles,
  volunteerSection,
} from "@/db/schema";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminStep } from "@/components/admin/admin-card";
import { getDictionaryFor } from "@/lib/dictionaries";
import { getImageSize } from "@/lib/image-size";
import { SectionEditor } from "./section-editor";

export const dynamic = "force-dynamic";

const STEPS = ["Words", "Photo", "Board members", "Ways to help"];

export default async function BoardAdminPage() {
  const [sections, members, roles, enDict, jaDict] = await Promise.all([
    db
      .select()
      .from(volunteerSection)
      .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID)),
    db
      .select()
      .from(boardMembers)
      .where(eq(boardMembers.visible, true))
      .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.createdAt)),
    db
      .select()
      .from(volunteerRoles)
      .where(eq(volunteerRoles.visible, true))
      .orderBy(asc(volunteerRoles.sortOrder), asc(volunteerRoles.createdAt)),
    getDictionaryFor("en"),
    getDictionaryFor("ja"),
  ]);

  const section = sections[0];

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Board & Volunteers</h1>
      <p className="mt-1 mb-6 max-w-xl text-stone">
        Change the words and photo for the Board & Volunteers part of the
        home page. Your changes appear on the website as soon as you save.
      </p>

      <ol className="mb-8 flex flex-wrap gap-x-8 gap-y-3">
        {STEPS.map((label, index) => (
          <li key={label} className="flex items-center gap-2">
            <AdminStep n={index + 1} />
            <span className="font-medium text-ink">{label}</span>
          </li>
        ))}
      </ol>

      {!section ? (
        <AdminAlert>
          This section hasn&apos;t been set up yet. Ask a developer to run{" "}
          <code>npm run seed-volunteer-section</code>.
        </AdminAlert>
      ) : (
        <SectionEditor
          section={section}
          members={members}
          roles={roles}
          photoSize={section.photoUrl ? await getImageSize(section.photoUrl) : null}
          labels={{ en: enDict.home.board, ja: jaDict.home.board }}
        />
      )}
    </div>
  );
}
