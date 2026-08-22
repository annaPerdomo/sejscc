import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KanjiWatermark } from "@/components/kanji-watermark";
import { PageHero } from "@/components/page-hero";
import { SectionKicker } from "@/components/section-kicker";
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
  const facts = [
    { label: dict.eventDetail.date, value: date },
    { label: dict.eventDetail.time, value: time },
    { label: dict.eventDetail.where, value: event.location },
  ].filter((fact) => fact.value);

  const backLink = (
    <Link
      href={localePath(lang, "/events")}
      className="font-display text-sm font-semibold text-indigo hover:text-indigo-deep"
    >
      {dict.eventDetail.back}
    </Link>
  );

  return (
    <>
      <PageHero
        id="event-detail"
        wash="section-wash-events-hero"
        watermark="祭"
        watermarkClassName="-right-14 -bottom-24 text-magenta/5"
        accent={dict.eventDetail.kickerAccent}
        caption={dict.eventDetail.kickerCaption}
        titleLine1={event.title}
        eyebrow={backLink}
        facts={
          facts.length > 0 && (
            <dl className="flex flex-wrap gap-x-9 gap-y-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="font-display text-xs font-semibold tracking-[0.14em] text-stone uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-base font-semibold text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          )
        }
        media={
          <div className="reveal-rise w-full shrink-0 self-start sm:mx-auto sm:max-w-sm lg:mx-0 lg:w-88 xl:w-96">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 -rotate-3 rounded-xl border border-line bg-cream shadow-sm"
              />
              <div className="surface-card relative aspect-flyer overflow-clip bg-mist lg:rotate-1">
                {event.flyerUrl ? (
                  <div className="absolute inset-3">
                    <Image
                      src={event.flyerUrl}
                      alt={dict.eventDetail.flyerAlt.replace("{title}", event.title)}
                      fill
                      sizes="(max-width: 639px) 100vw, 24rem"
                      className="object-contain"
                      preload
                    />
                  </div>
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
            </div>
            {event.flyerDownloadUrl && (
              <a
                href={event.flyerDownloadUrl}
                download
                className="mt-8 block rounded-lg border-2 border-ink/20 px-5 py-3 text-center font-display text-sm font-semibold text-ink hover:border-ink"
              >
                {dict.eventDetail.downloadFlyer}
              </a>
            )}
          </div>
        }
      />

      <section className="relative overflow-clip bg-white py-14 sm:py-16">
        <KanjiWatermark char="縁" className="-right-14 -bottom-20 text-indigo/5" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-10 px-4 sm:px-6">
          {event.description && (
            <div className="reveal-rise max-w-3xl">
              <SectionKicker
                accent={dict.eventDetail.aboutAccent}
                caption={dict.eventDetail.aboutCaption}
              />
              <div className="mt-5 leading-relaxed whitespace-pre-line text-ink-soft">
                {event.description}
              </div>
            </div>
          )}
          {backLink}
        </div>
      </section>
    </>
  );
}
