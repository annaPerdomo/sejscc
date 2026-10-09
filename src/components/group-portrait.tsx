import Image from "next/image";
import { EventMeta } from "@/components/event-meta";
import { ExternalLink } from "@/components/external-link";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import { getDictionary } from "@/lib/dictionaries";
import type { Group } from "@/lib/events";
import { getCenterContact } from "@/lib/site-settings";
import { weekDays } from "@/db/schema";

const SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30rem";

export async function GroupPortrait({ group }: { group: Group }) {
  const [dict, contact] = await Promise.all([getDictionary(), getCenterContact()]);
  const muted = group.status !== "meeting";
  const statusLabel =
    group.status === "paused"
      ? dict.groups.pausedLabel
      : group.status === "cancelled"
        ? dict.groups.cancelledLabel
        : null;
  const meetingDays = weekDays
    .filter((day) => group.meetingDays.includes(day))
    .map((day) => dict.groups.weekDays[day])
    .join(" · ");
  const logo = group.imageIsLogo ? group.imageUrl : null;
  const photo = group.photoUrls[0] ?? (group.imageIsLogo ? null : group.imageUrl);

  return (
    <article className="group reveal-bloom flex flex-col">
      <div
        className={`relative aspect-photo overflow-clip rounded-sm shadow-lg ${
          muted ? "grayscale" : ""
        }`}
      >
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes={SIZES}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : logo ? (
          <div className="seigaiha-rings absolute inset-0 bg-cream">
            <Image src={logo} alt="" fill sizes={SIZES} className="object-contain p-10" />
          </div>
        ) : (
          <PhotoPlaceholder
            label={dict.groups.photoLabel}
            frame={false}
            className="absolute inset-0"
          />
        )}
        {photo && logo && (
          <span className="absolute bottom-3 left-3 size-16 overflow-clip rounded-full bg-white shadow-md ring-2 ring-gold">
            <Image src={logo} alt="" fill sizes="4rem" className="object-contain p-2" />
          </span>
        )}
        {statusLabel && (
          <span className="absolute top-3 right-3 rounded-xs bg-ink-deep px-3 py-1.5 font-display text-sm font-semibold tracking-[0.12em] text-white uppercase">
            {statusLabel}
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <h3
            className={`font-display text-2xl leading-snug font-semibold ${
              muted ? "text-ink-soft" : "text-ink"
            }`}
          >
            {group.name}
          </h3>
          {group.nameJa && (
            <span
              lang="ja"
              className={`shrink-0 pt-1 font-accent text-lg font-bold tracking-[0.12em] ${
                muted ? "text-ink-soft" : "text-magenta"
              }`}
            >
              {group.nameJa}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-1 text-base text-ink-soft">
          {group.meetingSchedule ? (
            <p>
              <EventMeta icon="repeat">{group.meetingSchedule}</EventMeta>
            </p>
          ) : (
            meetingDays && (
              <p>
                <EventMeta icon="calendar">{meetingDays}</EventMeta>
              </p>
            )
          )}
          <p>
            <EventMeta icon="pin">{dict.groups.meetsAtCenter}</EventMeta>
          </p>
        </div>

        {group.description && (
          <p className="mt-3 text-base leading-relaxed text-ink-soft">{group.description}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-4 font-display text-base font-semibold">
          {group.websiteUrl && (
            <ExternalLink
              href={group.websiteUrl}
              className="link-arrow py-1 text-indigo hover:text-indigo-deep"
            >
              {dict.groups.website}
            </ExternalLink>
          )}
          {group.contactEmail ? (
            <a
              href={`mailto:${group.contactEmail}`}
              className="py-1 break-words text-indigo hover:text-indigo-deep"
            >
              {group.contactEmail}
            </a>
          ) : (
            !group.websiteUrl && (
              <a
                href={`mailto:${contact.email}`}
                className="link-arrow py-1 text-indigo hover:text-indigo-deep"
              >
                {dict.groups.askCta}
              </a>
            )
          )}
        </div>
      </div>
    </article>
  );
}
