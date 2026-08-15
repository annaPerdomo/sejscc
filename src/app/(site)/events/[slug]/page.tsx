import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? undefined,
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const date = formatEventDate(event.startAt);
  const time = formatEventTime(event.startAt, event.endAt);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <Link
        href="/events"
        className="text-sm font-semibold text-vermilion hover:text-vermilion-deep"
      >
        ← All events
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <div className="relative aspect-[17/22] overflow-hidden rounded-xl border border-sand bg-cream-deep shadow-sm">
            {event.flyerUrl ? (
              <Image
                src={event.flyerUrl}
                alt={`${event.title} flyer`}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-contain"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center font-serif text-5xl text-sand">
                桜
              </div>
            )}
          </div>
          {event.flyerDownloadUrl && (
            <a
              href={event.flyerDownloadUrl}
              download
              className="mt-4 block rounded-md border border-ink/20 px-4 py-2.5 text-center text-sm font-semibold text-ink hover:bg-white"
            >
              Download printable flyer
            </a>
          )}
        </div>
        <div>
          <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">
            {event.title}
          </h1>
          <dl className="mt-6 space-y-3 rounded-xl border border-sand bg-white p-5 text-[15px]">
            {date && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 font-semibold text-stone">Date</dt>
                <dd className="text-ink">{date}</dd>
              </div>
            )}
            {time && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 font-semibold text-stone">Time</dt>
                <dd className="text-ink">{time}</dd>
              </div>
            )}
            {event.location && (
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 font-semibold text-stone">
                  Where
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
