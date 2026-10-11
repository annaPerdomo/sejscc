import type { ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { boardMembers, volunteerSection } from "@/db/schema";
import { EDITABLE_PAGES, type EditablePage, type EditablePageId } from "@/lib/editable-pages";
import { getActiveGroups, getUpcomingEvents } from "@/lib/events";
import { isUploadedFileUrl } from "@/lib/format";
import { boardPhoto } from "@/lib/photos";
import { getAllSchoolLevels } from "@/lib/school-levels";
import { getAllSchoolYearEvents } from "@/lib/school-year-events";
import { getAnnouncement, getCenterContact } from "@/lib/site-settings";
import { getSitePhotos } from "@/lib/site-photos";
import { getSiteTextOverrides } from "@/lib/site-text";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { byAdminPageOrder, PAGE_TONES } from "@/components/admin/admin-page-tone";
import { AdminPageWidth } from "@/components/admin/admin-page-width";

export const dynamic = "force-dynamic";

type PageLink = { href: string; label: string };
type SectionPreview = { id: string; label: string; href: string; photo: ImageProps["src"] | null };

function firstUploaded(urls: (string | null)[]): string | null {
  return urls.find((url): url is string => url !== null && isUploadedFileUrl(url)) ?? null;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function changesSummary(textCount: number, photoCount: number): string {
  if (textCount === 0 && photoCount === 0) {
    return "Every word and photo is still the original.";
  }

  const parts: string[] = [];
  if (textCount > 0) parts.push(plural(textCount, "sentence", "sentences"));
  if (photoCount > 0) parts.push(plural(photoCount, "photo", "photos"));

  const total = textCount + photoCount;
  const changed = parts.join(" and ");
  const verb = total === 1 ? "has" : "have";
  const noun = total === 1 ? "the original" : "the originals";
  return `${changed} ${verb} been changed from ${noun}.`;
}

function SectionStrip({ sections, kanji }: { sections: SectionPreview[]; kanji: string }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sections.map((section) => (
        <li key={section.id}>
          <Link href={section.href} className="group block rounded-lg">
            <div className="relative aspect-photo overflow-clip rounded-lg border border-ink/10 bg-white group-hover:border-indigo">
              {section.photo ? (
                <Image
                  src={section.photo}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 10rem, (min-width: 640px) 30vw, 45vw"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-full items-center justify-center font-accent text-2xl font-bold text-ink-soft"
                >
                  {kanji}
                </span>
              )}
            </div>
            <span className="mt-1 block text-sm leading-snug text-ink group-hover:underline">
              {section.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PageCard({
  page,
  sections,
  status,
  primary,
  others,
}: {
  page: EditablePage;
  sections: SectionPreview[];
  status: string[];
  primary: PageLink;
  others: PageLink[];
}) {
  const tone = PAGE_TONES[page.id];
  const headingId = `page-card-${page.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col rounded-xl border border-ink/10 p-6 ${tone.surface}`}
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white font-accent text-2xl font-bold text-ink"
        >
          {tone.kanji}
        </span>
        <h3 id={headingId} className="font-display text-2xl text-ink">
          {page.label}
        </h3>
      </div>

      <ul className="mt-4 space-y-1 text-base text-ink">
        {status.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <h4 className="mt-5 mb-2 font-display text-base font-semibold text-ink-soft">
        On this page, from top to bottom
      </h4>
      <SectionStrip sections={sections} kanji={tone.kanji} />

      <div className="mt-6 flex flex-1 flex-col justify-end gap-3">
        <AdminButtonLink href={primary.href}>{primary.label}</AdminButtonLink>
        {others.map((link) => (
          <AdminButtonLink key={link.href} href={link.href} variant="secondary">
            {link.label}
          </AdminButtonLink>
        ))}
        <Link
          href={page.href}
          className="inline-flex min-h-11 items-center self-start font-semibold text-ink underline underline-offset-4 hover:text-indigo-deep"
        >
          See this page on the website
        </Link>
      </div>
    </section>
  );
}

function PageSketch({ highlight }: { highlight: "top" | "bottom" }) {
  const band = "h-3 rounded-sm bg-indigo";
  const line = "h-1.5 rounded-full bg-line";
  return (
    <div
      aria-hidden="true"
      className="flex h-24 w-20 shrink-0 flex-col gap-1.5 rounded-lg border-2 border-line bg-white p-1.5"
    >
      <div className={highlight === "top" ? band : line} />
      <div className={line} />
      <div className={`${line} w-3/4`} />
      <div className={line} />
      <div className={`${line} w-2/3`} />
      <div className="flex-1" />
      <div className={highlight === "bottom" ? band : line} />
    </div>
  );
}

function SharedPartCard({
  title,
  highlight,
  where,
  children,
  href,
  action,
}: {
  title: string;
  highlight: "top" | "bottom";
  where: string;
  children: ReactNode;
  href: string;
  action: string;
}) {
  return (
    <AdminCard>
      <div className="flex flex-col gap-5 sm:flex-row">
        <PageSketch highlight={highlight} />
        <div className="min-w-0">
          <h3 className="font-display text-2xl text-ink">{title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{where}</p>
          <div className="mt-3 text-base break-words text-ink">{children}</div>
        </div>
      </div>
      <div className="mt-6 flex flex-col">
        <AdminButtonLink href={href}>{action}</AdminButtonLink>
      </div>
    </AdminCard>
  );
}

export default async function AdminDashboard() {
  const session = await auth();
  const [
    activeGroups,
    upcomingEvents,
    allBoardMembers,
    boardSections,
    allSchoolLevels,
    allSchoolYearEvents,
    announcement,
    siteTextOverrides,
    sitePhotos,
    contact,
  ] = await Promise.all([
    getActiveGroups(),
    getUpcomingEvents(),
    db.select({ visible: boardMembers.visible }).from(boardMembers),
    db.select({ photoUrl: volunteerSection.photoUrl }).from(volunteerSection),
    getAllSchoolLevels(),
    getAllSchoolYearEvents(),
    getAnnouncement(),
    getSiteTextOverrides(),
    getSitePhotos(),
    getCenterContact(),
  ]);

  const boardMemberCounts = {
    showing: allBoardMembers.filter((member) => member.visible).length,
    hidden: allBoardMembers.filter((member) => !member.visible).length,
  };

  const schoolLevelCounts = {
    showing: allSchoolLevels.filter((level) => level.visible).length,
    hidden: allSchoolLevels.filter((level) => !level.visible).length,
  };

  const schoolYearEventCounts = {
    showing: allSchoolYearEvents.filter((event) => event.visible && event.photoUrl).length,
    hidden: allSchoolYearEvents.filter((event) => !event.visible && event.photoUrl).length,
    pending: allSchoolYearEvents.filter((event) => !event.photoUrl).length,
  };

  function changesOn(page: EditablePage): string {
    const paths = page.sections.flatMap((section) => section.fields.map((field) => field.path));
    const slots = page.sections.flatMap((section) => section.photos.map((photo) => photo.id));
    return changesSummary(
      paths.filter((path) => siteTextOverrides.has(path)).length,
      slots.filter((slot) => sitePhotos.has(slot)).length
    );
  }

  const groupPhoto = firstUploaded(
    activeGroups.flatMap((group) => [...group.photoUrls, group.imageIsLogo ? null : group.imageUrl])
  );
  const photosFromLists: Record<string, ImageProps["src"] | null> = {
    "home-board": firstUploaded(boardSections.map((section) => section.photoUrl)) ?? boardPhoto,
    "home-sports-clubs": groupPhoto,
    "groups-directory": groupPhoto,
    "events-upcoming": firstUploaded(upcomingEvents.map((event) => event.flyerUrl)),
    "school-classes": firstUploaded(
      allSchoolLevels.filter((level) => level.visible).map((level) => level.photoUrl)
    ),
    "school-year": firstUploaded(
      allSchoolYearEvents.filter((event) => event.visible).map((event) => event.photoUrl)
    ),
  };

  function sectionPreviews(page: EditablePage): SectionPreview[] {
    return page.sections.map((section) => {
      const slot = section.photos[0];
      return {
        id: section.id,
        label: section.label,
        href: `/admin/pages/${page.id}#${section.id}`,
        photo: slot
          ? (sitePhotos.get(slot.id)?.url ?? slot.defaultSrc)
          : (photosFromLists[section.id] ?? null),
      };
    });
  }

  const orderedPages = [...EDITABLE_PAGES].sort(byAdminPageOrder);
  const hiddenNote = (hidden: number) => (hidden > 0 ? ` (${hidden} hidden)` : "");
  const wordsAndPhotos = (id: EditablePageId) => ({
    href: `/admin/pages/${id}`,
    label: "Change the words & photos",
  });

  const pageCards: Record<
    EditablePageId,
    { status: string[]; primary: PageLink; others: PageLink[] }
  > = {
    home: {
      status: [
        `${plural(boardMemberCounts.showing, "board member is", "board members are")} showing${hiddenNote(boardMemberCounts.hidden)}.`
      ],
      primary: wordsAndPhotos("home"),
      others: [{ href: "/admin/board", label: "Board of Directors" }],
    },
    school: {
      status: [
        `${plural(schoolLevelCounts.showing, "class level is", "class levels are")} showing${hiddenNote(schoolLevelCounts.hidden)}.`,
        `${plural(schoolYearEventCounts.showing, "school-year event is", "school-year events are")} showing${hiddenNote(schoolYearEventCounts.hidden)}${schoolYearEventCounts.pending > 0 ? ` (${schoolYearEventCounts.pending} still need a photo)` : ""}.`
      ],
      primary: wordsAndPhotos("school"),
      others: [
        { href: "/admin/levels", label: "Class levels" },
        { href: "/admin/school-year", label: "The school year" },
      ],
    },
    events: {
      status: [
        `${plural(upcomingEvents.length, "event is", "events are")} coming up.`
      ],
      primary: { href: "/admin/events/new", label: "+ Add a new event" },
      others: [
        { href: "/admin/events", label: "Change or remove an event" },
        wordsAndPhotos("events"),
      ],
    },
    groups: {
      status: [
        `${plural(activeGroups.length, "group is", "groups are")} listed.`
      ],
      primary: { href: "/admin/groups/new", label: "+ Add a new group" },
      others: [
        { href: "/admin/groups", label: "Change or remove a group" },
        wordsAndPhotos("groups"),
      ],
    },
    donate: {
      status: [],
      primary: wordsAndPhotos("donate"),
      others: [{ href: "/admin/donations", label: "Donation details" }],
    },
  };

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] ?? null;
  const today = new Date();

  return (
    <AdminPageWidth>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            {firstName ? (
              <>
                Welcome back,{" "}
                <span className="text-indigo">{firstName.toUpperCase()}</span>
              </>
            ) : (
              "Welcome back"
            )}
          </h1>
          <p className="mt-2 text-stone">What would you like to do today?</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-stone uppercase">
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "America/Los_Angeles",
            })}
          </p>
          <p className="font-display text-sm text-ink">
            {today.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "America/Los_Angeles",
            })}
          </p>
        </div>
      </div>

      {!firstName && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-cream px-5 py-4">
          <p className="text-sm text-ink-soft">
            We don’t have your name yet — add it so the site can greet you by
            name.
          </p>
          <AdminButtonLink href="/admin/profile" variant="secondary">
            Add your name
          </AdminButtonLink>
        </div>
      )}

      <section aria-labelledby="dashboard-pages" className="mt-10">
        <h2 id="dashboard-pages" className="font-display text-2xl text-ink">
          Pages of the website
        </h2>
        <p className="mt-1 text-lg text-ink-soft">
          Find the page you want to change. Each page has its own color, and
          the menu uses the same colors.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {orderedPages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              sections={sectionPreviews(page)}
              {...pageCards[page.id]}
              status={[...pageCards[page.id].status, changesOn(page)]}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="dashboard-shared" className="mt-14">
        <h2 id="dashboard-shared" className="font-display text-2xl text-ink">
          Top &amp; bottom of every page
        </h2>
        <p className="mt-1 text-lg text-ink-soft">
          These show on every page, so you only change them once.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <SharedPartCard
            title="Top banner"
            highlight="top"
            where="A short message in a strip above the menu."
            href="/admin/announcement"
            action="Change the top banner"
          >
            {announcement
              ? `Showing now: “${announcement.text}”`
              : "No message right now, so the banner shows the next event."}
          </SharedPartCard>
          <SharedPartCard
            title="Phone, email & address"
            highlight="bottom"
            where="At the bottom of every page, and on the home and donations pages."
            href="/admin/contact"
            action="Change phone, email or address"
          >
            <p>{contact.phone}</p>
            <p>{contact.email}</p>
            <p>{contact.address}</p>
          </SharedPartCard>
        </div>
      </section>
    </AdminPageWidth>
  );
}
