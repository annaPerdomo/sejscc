import type { Metadata } from "next";
import Image from "next/image";
import { getActiveGroups } from "@/lib/events";
import { getDictionary, getDictionaryFor } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    title: dict.groups.metaTitle,
    description: dict.groups.metaDescription,
    alternates: {
      canonical: localePath(lang, "/groups"),
      languages: {
        en: "/groups",
        ja: "/ja/groups",
        "x-default": "/groups",
      },
    },
  };
}

export default async function GroupsPage() {
  const [dict, groups] = await Promise.all([getDictionary(), getActiveGroups()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h1 className="font-serif text-4xl text-ink sm:text-5xl">
        {dict.groups.title}
      </h1>
      <div className="mt-4 h-1 w-12 rounded-full bg-vermilion" />
      <p className="mt-5 max-w-2xl text-stone">{dict.groups.lede}</p>

      {groups.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex gap-5 rounded-xl border border-line bg-white p-6 shadow-sm"
            >
              {group.imageUrl && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-mist">
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
                      {dict.groups.website}
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
        <p className="mt-10 rounded-xl border border-line bg-white p-8 text-stone">
          {dict.groups.empty}
        </p>
      )}

      <div className="mt-12 rounded-xl border border-line bg-mist p-8">
        <h2 className="font-serif text-2xl text-ink">{dict.groups.useTitle}</h2>
        <p className="mt-2 max-w-2xl text-stone">
          {dict.groups.useBefore}
          <a
            href="mailto:info@sejscc.org"
            className="font-semibold text-vermilion hover:text-vermilion-deep"
          >
            info@sejscc.org
          </a>
          {dict.groups.useAfter}
        </p>
      </div>
    </div>
  );
}
