import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { getDictionary, getDictionaryFor, getLocale } from "@/lib/dictionaries";
import { hasLocale, localePath } from "@/lib/i18n";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  const event = await getEventBySlug(slug);
  if (!event) return { title: dict.eventDetail.notFound };
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? undefined,
    alternates: {
      canonical: localePath(lang, `/events/${slug}`),
      languages: {
        en: `/events/${slug}`,
        ja: `/ja/events/${slug}`,
        "x-default": `/events/${slug}`,
      },
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const [lang, dict, event] = await Promise.all([
    getLocale(),
    getDictionary(),
    getEventBySlug(slug),
  ]);
  if (!event) notFound();

  const date = formatEventDate(event.startAt, lang);
  const time = formatEventTime(event.startAt, event.endAt, lang);

  return (
    <div className="page-shell mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <Link
        href={localePath(lang, "/events")}
        className="text-sm font-semibold text-indigo hover:text-indigo-deep"
      >
        {dict.eventDetail.back}
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <div className="surface-card relative aspect-flyer overflow-hidden bg-mist p-3">
            {event.flyerUrl ? (
              <Image
                src={event.flyerUrl}
                alt={dict.eventDetail.flyerAlt.replace("{title}", event.title)}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-contain"
                preload
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Image
                  src="/logo-mark.png"
                  alt=""
                  width={72}
                  height={72}
                  className="opacity-10"
                />
              </div>
            )}
          </div>
          {event.flyerDownloadUrl && (
            <a
              href={event.flyerDownloadUrl}
              download
              className="mt-4 block rounded-md border border-ink/20 px-4 py-2.5 text-center text-sm font-semibold text-ink hover:bg-mist"
            >
              {dict.eventDetail.downloadFlyer}
            </a>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {event.title}
          </h1>
          <dl className="surface-card mt-6 space-y-3 p-5 text-[15px]">
            {date && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 font-semibold text-stone">
                  {dict.eventDetail.date}
                </dt>
                <dd className="text-ink">{date}</dd>
              </div>
            )}
            {time && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 font-semibold text-stone">
                  {dict.eventDetail.time}
                </dt>
                <dd className="text-ink">{time}</dd>
              </div>
            )}
            {event.location && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 font-semibold text-stone">
                  {dict.eventDetail.where}
                </dt>
                <dd className="text-ink">{event.location}</dd>
              </div>
            )}
          </dl>
          {event.description && (
            <div className="mt-6 leading-relaxed whitespace-pre-line text-ink-soft">
              {event.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
