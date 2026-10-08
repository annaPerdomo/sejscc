import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { VOLUNTEER_SECTION_ID, boardMembers, volunteerSection } from "@/db/schema";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getDictionaryFor } from "@/lib/dictionaries";
import { getImageSize } from "@/lib/image-size";
import { SectionCanvas } from "./section-canvas";

export const dynamic = "force-dynamic";

export default async function BoardAdminPage() {
  const [sections, members, enDict, jaDict] = await Promise.all([
    db
      .select()
      .from(volunteerSection)
      .where(eq(volunteerSection.id, VOLUNTEER_SECTION_ID)),
    db
      .select()
      .from(boardMembers)
      .orderBy(asc(boardMembers.sortOrder), asc(boardMembers.createdAt)),
    getDictionaryFor("en"),
    getDictionaryFor("ja"),
  ]);

  const section = sections[0];

  return (
    <div>
      <AdminPageWidth>
        <h1 className="font-display text-3xl text-ink">Board of Directors</h1>
        <p className="mt-1 mb-6 max-w-2xl text-stone">
          Below is the board section exactly as it appears on the home page.
          Click any words, the photo, or a person&apos;s name to change it. Each
          change goes live on the website as soon as you press Save, and you can
          undo the last one.
        </p>
      </AdminPageWidth>

      {!section ? (
        <AdminPageWidth>
          <AdminAlert>
            This section hasn&apos;t been set up yet. Ask a developer to run{" "}
            <code>npm run seed-volunteer-section</code>.
          </AdminAlert>
        </AdminPageWidth>
      ) : (
        <SectionCanvas
          section={section}
          members={members}
          photoSize={section.photoUrl ? await getImageSize(section.photoUrl) : null}
          labels={{ en: enDict.home.board, ja: jaDict.home.board }}
        />
      )}
    </div>
  );
}
