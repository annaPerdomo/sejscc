import { EventMeta } from "@/components/event-meta";
import { ExternalLink } from "@/components/external-link";
import { GroupMedia } from "@/components/group-media";
import { CENTER_EMAIL } from "@/lib/center";
import { getDictionary } from "@/lib/dictionaries";
import type { Group } from "@/lib/events";
import { weekDays } from "@/db/schema";

export async function GroupCard({
  group,
  sizes,
}: {
  group: Group;
  sizes: string;
}) {
  const dict = await getDictionary();
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

  return (
    <article
      className={`group reveal-bloom relative flex flex-col overflow-clip rounded-none ${
        muted
          ? "border border-dashed border-line bg-cloud"
          : "surface-card surface-card-link"
      }`}
    >
      <GroupMedia
        src={group.imageUrl}
        placeholderLabel={dict.groups.photoLabel}
        sizes={sizes}
        muted={muted}
        className="border-b border-line"
      />
      {statusLabel && (
        <span className="absolute top-3 right-3 rounded-md border border-line bg-white/90 px-2.5 py-1 font-display text-[11px] font-semibold tracking-[0.14em] text-stone uppercase">
          {statusLabel}
        </span>
      )}

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h3
            className={`font-display text-lg font-semibold ${
              muted ? "text-ink-soft" : "text-ink"
            }`}
          >
            {group.name}
          </h3>
          {group.nameJa && (
            <span
              lang="ja"
              className={`font-accent text-sm font-bold tracking-[0.16em] ${
                muted ? "text-stone" : "text-indigo"
              }`}
            >
              {group.nameJa}
            </span>
          )}
        </div>

        <div
          className={`flex flex-col gap-1 text-sm ${
            muted ? "text-stone" : "text-ink-soft"
          }`}
        >
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
          <p
            className={`text-sm leading-relaxed ${
              muted ? "text-stone" : "text-ink-soft"
            }`}
          >
            {group.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 font-display text-sm font-semibold">
          {group.websiteUrl && (
            <ExternalLink
              href={group.websiteUrl}
              className="link-arrow text-indigo hover:text-indigo-deep"
            >
              {dict.groups.website}
            </ExternalLink>
          )}
          {group.contactEmail ? (
            <a
              href={`mailto:${group.contactEmail}`}
              className="break-words text-indigo hover:text-indigo-deep"
            >
              {group.contactEmail}
            </a>
          ) : (
            !group.websiteUrl && (
              <a
                href={`mailto:${CENTER_EMAIL}`}
                className="link-arrow text-indigo hover:text-indigo-deep"
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
