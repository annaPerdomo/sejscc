import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SectionKicker } from "@/components/section-kicker";
import { SitePhoto } from "@/components/site-photo";
import { boardPhoto } from "@/lib/photos";
import type { VolunteerSectionView } from "@/lib/volunteers-view";

export type VolunteerSectionLabels = {
  kickerAccent: string;
  kickerCaption: string;
  membersLabel: string;
};

export type SectionTextField =
  | "title"
  | "intro"
  | "volunteersNote"
  | "contactNote"
  | "contactLinkLabel";

export type VolunteerSectionEdit = {
  text: (field: SectionTextField, value: string) => ReactNode;
  photo: (image: ReactNode) => ReactNode;
  member?: (
    member: VolunteerSectionView["members"][number],
    content: ReactNode
  ) => ReactNode;
  afterMembers?: ReactNode;
};

export function VolunteerSection({
  view,
  labels,
  contactHref,
  edit,
}: {
  view: VolunteerSectionView;
  labels: VolunteerSectionLabels;
  contactHref: string;
  edit?: VolunteerSectionEdit;
}) {
  const photoImage = view.photo ? (
    <Image
      src={view.photo.src}
      alt={view.photoAlt}
      width={view.photo.width}
      height={view.photo.height}
      sizes="(max-width: 1024px) calc(100vw - 4rem), 44rem"
      className="h-auto w-full"
    />
  ) : (
    <Image
      src={boardPhoto}
      alt={view.photoAlt}
      sizes="(max-width: 1024px) calc(100vw - 4rem), 44rem"
      placeholder="blur"
    />
  );

  return (
    <div className="@container">
      <div className="relative mx-auto max-w-7xl px-4 pt-14 @volunteer-sm:px-6 @volunteer-sm:pt-18 @volunteer-lg:px-10 @volunteer-lg:pt-24">
        <div
          className={`grid gap-10 @volunteer-lg:grid-cols-12 @volunteer-lg:gap-14 ${
            edit ? "@volunteer-lg:items-start" : "@volunteer-lg:items-center"
          }`}
        >
          <div className="reveal-swing-left @volunteer-lg:col-span-7">
            <div className="flyer-mount relative">
              <div className="photo-develop">
                {edit ? edit.photo(photoImage) : photoImage}
              </div>
            </div>
          </div>
          <div className="reveal-rise @volunteer-lg:col-span-5">
            <SectionKicker
              accent={labels.kickerAccent}
              caption={labels.kickerCaption}
              tone="magenta"
              order="caption-first"
            />
            <h3 className="mt-4 font-display text-3xl leading-snug font-normal tracking-[0.02em] text-ink @volunteer-sm:text-4xl">
              {edit ? edit.text("title", view.title) : view.title}
            </h3>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              {edit ? edit.text("intro", view.intro) : view.intro}
            </p>
            {(edit || view.members.length > 0) && (
              <ul
                aria-label={labels.membersLabel}
                className="seigaiha-rings reveal-stagger-2 mt-7 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-line bg-mist px-6 py-6"
              >
                {view.members.map((member) => {
                  const photoOrDot = member.photoUrl ? (
                    <SitePhoto
                      photo={{ src: member.photoUrl, alt: "" }}
                      sizes="32px"
                      placeholderLabel=""
                      shape="circle"
                      className="size-8 shrink-0"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="reveal-pop h-1.5 w-1.5 shrink-0 rounded-full bg-magenta"
                    />
                  );

                  const nameBlock = (
                    <>
                      <span className="font-display text-base font-medium text-ink">
                        {member.name}
                      </span>
                      {member.role && (
                        <span className="text-sm text-ink-soft">{member.role}</span>
                      )}
                    </>
                  );

                  if (!edit) {
                    return (
                      <li key={member.id} className="reveal-rise flex items-center gap-2.5">
                        {photoOrDot}
                        <span className="flex flex-col">{nameBlock}</span>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={member.id}
                      className={`reveal-rise flex items-center gap-2.5 rounded-xl p-1.5${
                        member.visible ? "" : " border border-dashed border-line"
                      }`}
                    >
                      {photoOrDot}
                      {edit.member?.(member, nameBlock)}
                    </li>
                  );
                })}
                {edit?.afterMembers}
              </ul>
            )}
            <p className="mt-7 leading-relaxed text-ink-soft">
              {edit ? edit.text("volunteersNote", view.volunteersNote) : view.volunteersNote}
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              {edit ? edit.text("contactNote", view.contactNote) : view.contactNote}{" "}
              {edit ? (
                <span className="font-semibold text-indigo hover:text-indigo-deep">
                  {edit.text("contactLinkLabel", view.contactLinkLabel)}
                </span>
              ) : (
                <Link
                  href={contactHref}
                  className="font-semibold text-indigo hover:text-indigo-deep"
                >
                  {view.contactLinkLabel}
                </Link>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
