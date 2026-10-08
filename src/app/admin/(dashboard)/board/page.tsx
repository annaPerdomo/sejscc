import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  VOLUNTEER_SECTION_ID,
  boardMembers,
  volunteerRoles,
  volunteerSection,
} from "@/db/schema";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { AdminStep } from "@/components/admin/admin-card";
import { getDictionaryFor } from "@/lib/dictionaries";
import { getImageSize } from "@/lib/image-size";
import { BoardMembersEditor } from "./board-members-editor";
import { SectionEditor } from "./section-editor";
import { VolunteerRolesEditor } from "./volunteer-roles-editor";

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
      .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.createdAt)),
    db
      .select()
      .from(volunteerRoles)
      .orderBy(asc(volunteerRoles.sortOrder), asc(volunteerRoles.createdAt)),
    getDictionaryFor("en"),
    getDictionaryFor("ja"),
  ]);

  const section = sections[0];
  const visibleMembers = members.filter((member) => member.visible);
  const visibleRoles = roles.filter((role) => role.visible);

  return (
    <AdminPageWidth>
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
          members={visibleMembers}
          roles={visibleRoles}
          photoSize={section.photoUrl ? await getImageSize(section.photoUrl) : null}
          labels={{ en: enDict.home.board, ja: jaDict.home.board }}
        >
          <BoardMembersEditor members={members} />
          <VolunteerRolesEditor roles={roles} />
        </SectionEditor>
      )}
    </AdminPageWidth>
  );
}
