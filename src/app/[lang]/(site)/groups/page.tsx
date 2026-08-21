import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
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
    <div className="page-shell mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <PageHeader
        accent={dict.groups.kickerAccent}
        caption={dict.groups.kickerCaption}
        title={dict.groups.title}
        lede={dict.groups.lede}
      />

      {groups.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {groups.map((group) => (
            <div key={group.id} className="surface-card reveal-rise flex gap-5 p-6">
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
                <h2 className="font-display text-xl text-ink">{group.name}</h2>
                {group.meetingSchedule && (
                  <p className="mt-1 text-sm font-medium text-indigo">
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
                      className="text-indigo hover:text-indigo-deep"
                    >
                      {dict.groups.website}
                    </a>
                  )}
                  {group.contactEmail && (
                    <a
                      href={`mailto:${group.contactEmail}`}
                      className="text-indigo hover:text-indigo-deep"
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
        <p className="surface-card mt-10 p-8 text-stone">{dict.groups.empty}</p>
      )}

      <div className="callout-celadon mt-12 rounded-xl border border-celadon p-8 shadow-sm">
        <h2 className="font-display text-2xl text-ink">{dict.groups.useTitle}</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          {dict.groups.useBefore}
          <a
            href="mailto:info@sejscc.org"
            className="font-semibold text-indigo hover:text-indigo-deep"
          >
            info@sejscc.org
          </a>
          {dict.groups.useAfter}
        </p>
      </div>
    </div>
  );
}
