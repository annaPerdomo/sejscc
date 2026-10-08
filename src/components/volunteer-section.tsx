import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "@/components/external-link";
import { SectionKicker } from "@/components/section-kicker";
import { SitePhoto } from "@/components/site-photo";
import { boardPhoto } from "@/lib/photos";
import type { VolunteerSectionView } from "@/lib/volunteers-view";

export type VolunteerSectionLabels = {
  kickerAccent: string;
  kickerCaption: string;
  membersLabel: string;
  helpCta: string;
  askCta: string;
  newTab: string;
};

export type SectionTextField =
  | "title"
  | "intro"
  | "volunteersNote"
  | "contactNote"
  | "contactLinkLabel"
  | "waysTitle"
  | "waysIntro";

export type MemberTextFieldName = "name" | "role";
export type RoleTextFieldName = "title" | "description" | "commitment";

export type VolunteerSectionEdit = {
  text: (field: SectionTextField, value: string) => ReactNode;
  photo: (image: ReactNode) => ReactNode;
  memberText?: (
    member: VolunteerSectionView["members"][number],
    field: MemberTextFieldName,
    value: string
  ) => ReactNode;
  memberControls?: (member: VolunteerSectionView["members"][number]) => ReactNode;
  roleText?: (
    role: VolunteerSectionView["roles"][number],
    field: RoleTextFieldName,
    value: string
  ) => ReactNode;
  roleControls?: (role: VolunteerSectionView["roles"][number]) => ReactNode;
  afterMembers?: ReactNode;
  afterRoles?: ReactNode;
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
        <div className="grid gap-10 @volunteer-lg:grid-cols-12 @volunteer-lg:items-center @volunteer-lg:gap-14">
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
                className={
                  edit
                    ? "seigaiha-rings reveal-stagger-2 mt-7 grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border border-line bg-mist px-6 py-6 @volunteer-sm:grid-cols-2"
                    : "seigaiha-rings reveal-stagger-2 mt-7 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-line bg-mist px-6 py-6"
                }
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

                  if (!edit) {
                    return (
                      <li key={member.id} className="reveal-rise flex items-center gap-2.5">
                        {photoOrDot}
                        <span className="flex flex-col">
                          <span className="font-display text-base font-medium text-ink">
                            {member.name}
                          </span>
                          {member.role && (
                            <span className="text-sm text-ink-soft">{member.role}</span>
                          )}
                        </span>
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
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-display text-base font-medium text-ink">
                          {edit.memberText?.(member, "name", member.name)}
                        </span>
                        <span className="text-sm text-ink-soft">
                          {edit.memberText?.(member, "role", member.role ?? "")}
                        </span>
                      </span>
                      {edit.memberControls?.(member)}
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

        {(edit || view.roles.length > 0) && (
          <div className="mt-16 @volunteer-sm:mt-20 @volunteer-lg:mt-24">
            <h3 className="reveal-rise font-display text-3xl leading-snug font-normal tracking-[0.02em] text-ink @volunteer-sm:text-4xl">
              {edit ? edit.text("waysTitle", view.waysTitle) : view.waysTitle}
            </h3>
            <p className="reveal-rise mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {edit ? edit.text("waysIntro", view.waysIntro) : view.waysIntro}
            </p>
            <ul className="reveal-stagger-2-3 mt-10 grid gap-x-10 gap-y-10 @volunteer-sm:grid-cols-2 @volunteer-lg:grid-cols-3">
              {view.roles.map((role, index) => {
                const titleId = `volunteer-role-${role.id}`;
                const indexBadge = (
                  <span
                    aria-hidden="true"
                    className="font-display text-4xl font-light text-magenta"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                );

                if (!edit) {
                  return (
                    <li key={role.id} className="reveal-rise flex flex-col">
                      {indexBadge}
                      <h4 id={titleId} className="mt-2 font-display text-2xl text-ink">
                        {role.title}
                      </h4>
                      {role.commitment && (
                        <span className="pill mt-3 w-fit text-xs font-semibold tracking-[0.04em]">
                          {role.commitment}
                        </span>
                      )}
                      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                        {role.description}
                      </p>
                      {role.signupUrl ? (
                        <ExternalLink
                          href={role.signupUrl}
                          aria-describedby={titleId}
                          className="button-primary mt-5 w-fit rounded-lg px-6 py-3.5 font-display text-sm font-semibold tracking-[0.08em] text-white uppercase"
                        >
                          {labels.helpCta}
                          <span className="sr-only"> {labels.newTab}</span>
                        </ExternalLink>
                      ) : (
                        <Link
                          href={contactHref}
                          aria-describedby={titleId}
                          className="link-arrow mt-5 w-fit font-semibold text-indigo hover:text-indigo-deep"
                        >
                          {labels.askCta}
                        </Link>
                      )}
                    </li>
                  );
                }

                return (
                  <li
                    key={role.id}
                    className={`reveal-rise flex flex-col rounded-xl p-2${
                      role.visible ? "" : " border border-dashed border-line"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {indexBadge}
                      {edit.roleControls?.(role)}
                    </div>
                    <h4 id={titleId} className="mt-2 font-display text-2xl text-ink">
                      {edit.roleText?.(role, "title", role.title)}
                    </h4>
                    <span className="pill mt-3 w-fit text-xs font-semibold tracking-[0.04em]">
                      {edit.roleText?.(role, "commitment", role.commitment ?? "")}
                    </span>
                    <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                      {edit.roleText?.(role, "description", role.description)}
                    </p>
                    {role.signupUrl ? (
                      <span className="button-primary mt-5 w-fit rounded-lg px-6 py-3.5 font-display text-sm font-semibold tracking-[0.08em] text-white uppercase">
                        {labels.helpCta}
                        <span className="sr-only"> {labels.newTab}</span>
                      </span>
                    ) : (
                      <span className="link-arrow mt-5 w-fit font-semibold text-indigo hover:text-indigo-deep">
                        {labels.askCta}
                      </span>
                    )}
                  </li>
                );
              })}
              {edit?.afterRoles}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
