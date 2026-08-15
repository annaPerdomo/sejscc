import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";

export function EventCard({ event }: { event: Event }) {
  const date = formatEventDate(event.startAt);
  const time = formatEventTime(event.startAt, event.endAt);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-sand bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[17/22] w-full bg-cream-deep">
        {event.flyerUrl ? (
          <Image
            src={event.flyerUrl}
            alt={`${event.title} flyer`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-3xl text-sand">
            桜
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-serif text-lg leading-snug text-ink group-hover:text-vermilion">
          {event.title}
        </h3>
        {date && (
          <p className="text-sm font-medium text-vermilion">
            {date}
            {time ? ` · ${time}` : ""}
          </p>
        )}
        {event.location && (
          <p className="text-sm text-stone">{event.location}</p>
        )}
      </div>
    </Link>
  );
}
