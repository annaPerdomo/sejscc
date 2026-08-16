import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { localePath } from "@/lib/i18n";

export async function EventCard({ event }: { event: Event }) {
  const [lang, dict] = await Promise.all([getLocale(), getDictionary()]);
  const date = formatEventDate(event.startAt, lang);
  const time = formatEventTime(event.startAt, event.endAt, lang);

  return (
    <Link
      href={localePath(lang, `/events/${event.slug}`)}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[17/22] w-full bg-mist">
        {event.flyerUrl ? (
          <Image
            src={event.flyerUrl}
            alt={dict.eventDetail.flyerAlt.replace("{title}", event.title)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image
              src="/logo-mark.png"
              alt=""
              width={56}
              height={56}
              className="opacity-10"
            />
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
