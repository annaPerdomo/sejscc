import type { Metadata } from "next";
import Image from "next/image";
import { getActiveGroups } from "@/lib/events";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Groups & Programs",
  description:
    "Japanese school, judo, basketball, and cultural groups that meet at the Southeast Japanese School & Community Center.",
};

export default async function GroupsPage() {
  const groups = await getActiveGroups();

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-ink">Groups &amp; Programs</h1>
      <p className="mt-3 max-w-2xl text-stone">
        The center is shared by independent groups and programs — from Japanese
        language school to judo and basketball. Reach out to a group directly
        to join, or contact the center to start a new one.
      </p>

      {groups.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex gap-5 rounded-xl border border-sand bg-white p-6 shadow-sm"
            >
              {group.imageUrl && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
                  <Image
                    src={group.imageUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="font-serif text-xl text-ink">{group.name}</h2>
                {group.meetingSchedule && (
                  <p className="mt-1 text-sm font-medium text-vermilion">
                    {group.meetingSchedule}
                  </p>
                )}
                {group.description && (
                  <p className="mt-2 text-sm leading-relaxed text-stone">
                    {group.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
                  {group.websiteUrl && (
                    <a
                      href={group.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-vermilion hover:text-vermilion-deep"
                    >
                      Website →
                    </a>
                  )}
                  {group.contactEmail && (
                    <a
                      href={`mailto:${group.contactEmail}`}
                      className="text-vermilion hover:text-vermilion-deep"
                    >
                      {group.contactEmail}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-sand bg-white p-8 text-stone">
          Group listings are coming soon. In the meantime, call the center at
          (562) 863-5996 to learn about Japanese school, judo, basketball, and
          other programs.
        </p>
      )}

      <div className="mt-12 rounded-xl border border-sand bg-cream-deep p-8">
        <h2 className="font-serif text-2xl text-ink">
          Want to use the center?
        </h2>
        <p className="mt-2 max-w-2xl text-stone">
          New clubs and classes are welcome. Contact the center at{" "}
          <a
            href="mailto:info@sejscc.org"
            className="font-semibold text-vermilion hover:text-vermilion-deep"
          >
            info@sejscc.org
          </a>{" "}
          or (562) 863-5996 to ask about facilities and scheduling.
        </p>
      </div>
    </div>
  );
}
