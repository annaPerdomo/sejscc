import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { changeLog, type ChangeLogEntry } from "@/db/schema";
import { buttonClass } from "@/components/admin/admin-button";
import { AdminEmptyState, adminPanel } from "@/components/admin/admin-card";
import { AdminSelect } from "@/components/admin/admin-field";
import { AdminPageWidth } from "@/components/admin/admin-page-width";
import { getCurrentUser } from "@/lib/admin";
import { CHANGE_KINDS, changedFields, type ChangeKind } from "@/lib/change-log";
import { isUploadedFileUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const TIME_ZONE = "America/Los_Angeles";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const IMAGE_FILE = /\.(png|jpe?g|webp|gif|avif)$/i;

const FIELD_WORDS: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  url: "Photo",
  alt: "Photo description",
  order: "Order",
};

function fieldLabel(key: string): string {
  if (FIELD_WORDS[key]) return FIELD_WORDS[key];
  const japanese = key.length > 2 && key.endsWith("Ja");
  const words = (japanese ? key.slice(0, -2) : key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\burl\b/g, "link")
    .replace(/\balt\b/g, "description");
  const label = words.charAt(0).toUpperCase() + words.slice(1);
  return japanese ? `${label} (Japanese)` : label;
}

function isUploadedImage(value: string): boolean {
  if (!isUploadedFileUrl(value)) return false;
  try {
    return IMAGE_FILE.test(new URL(value).pathname);
  } catch {
    return false;
  }
}

function isKind(kind: string): kind is ChangeKind {
  return Object.hasOwn(CHANGE_KINDS, kind);
}

function describeAction(entry: ChangeLogEntry): string {
  const original = isKind(entry.kind) && CHANGE_KINDS[entry.kind].missingMeansOriginal;
  if (entry.action === "reordered") return "reordered";
  if (entry.action === "added") return original ? "changed" : "added";
  if (entry.action === "removed") return original ? "put back the original for" : "removed";
  return "changed";
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

function ChangeValue({ value, empty }: { value: unknown; empty: string }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
    return <span className="text-stone italic">{empty}</span>;
  }
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (Array.isArray(value)) {
    return (
      <ol className="list-decimal space-y-0.5 pl-5">
        {value.map((item, index) => (
          <li key={index}>
            <ChangeValue value={item} empty={empty} />
          </li>
        ))}
      </ol>
    );
  }
  if (typeof value === "string" && ISO_DATE.test(value)) {
    return <>{value.slice(0, 16).replace("T", " ")}</>;
  }
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return (
      <span className="flex flex-col items-start gap-2">
        {isUploadedImage(value) && (
          <Image
            src={value}
            alt=""
            width={160}
            height={120}
            className="h-24 w-auto rounded-md border border-line object-contain"
          />
        )}
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-indigo-deep underline"
        >
          {value}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </span>
    );
  }
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

function ChangeCard({ entry }: { entry: ChangeLogEntry }) {
  const fields = changedFields(entry.before, entry.after);
  const area = isKind(entry.kind) ? CHANGE_KINDS[entry.kind].area : entry.kind;
  const emptyWord = isKind(entry.kind) && CHANGE_KINDS[entry.kind].missingMeansOriginal ? "original" : "empty";
  const editor = entry.editorName || entry.editorEmail || "Someone";

  return (
    <li className={`${adminPanel} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-ink">
          <span className="font-semibold">{editor}</span> {describeAction(entry)}{" "}
          <span className="text-stone">{area}:</span>{" "}
          <span className="font-semibold">{entry.label}</span>
        </p>
        <time dateTime={entry.changedAt.toISOString()} className="text-sm text-stone">
          {timeFormat.format(entry.changedAt)}
        </time>
      </div>
      {entry.editorName && entry.editorEmail && (
        <p className="mt-0.5 text-sm text-stone">{entry.editorEmail}</p>
      )}

      <dl className="mt-4 space-y-4">
        {fields.map((key) => (
          <div key={key} className="border-t border-line pt-3">
            <dt className="font-display text-sm font-semibold text-ink">{fieldLabel(key)}</dt>
            <dd className="mt-2 grid gap-2 text-sm text-ink sm:grid-cols-2 sm:gap-4">
              <div className="rounded-lg bg-mist p-3">
                <p className="mb-1 text-xs font-semibold tracking-wide text-stone uppercase">Before</p>
                <ChangeValue value={entry.before?.[key]} empty={emptyWord} />
              </div>
              <div className="rounded-lg bg-mist p-3">
                <p className="mb-1 text-xs font-semibold tracking-wide text-stone uppercase">After</p>
                <ChangeValue value={entry.after?.[key]} empty={emptyWord} />
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function groupByDay(entries: ChangeLogEntry[]) {
  const days = new Map<string, ChangeLogEntry[]>();
  for (const entry of entries) {
    const day = dayFormat.format(entry.changedAt);
    days.set(day, [...(days.get(day) ?? []), entry]);
  }
  return [...days];
}

function pageHref(page: number, editor: string | undefined) {
  const params = new URLSearchParams();
  if (editor) params.set("editor", editor);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/history?${query}` : "/admin/history";
}

export default async function ChangeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ editor?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "owner") notFound();

  const params = await searchParams;
  const editor = params.editor?.trim() || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const filter = editor ? eq(changeLog.editorEmail, editor) : undefined;

  const [entries, [{ total }], editorRows] = await Promise.all([
    db
      .select()
      .from(changeLog)
      .where(filter)
      .orderBy(desc(changeLog.changedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(changeLog).where(filter),
    db
      .selectDistinct({ email: changeLog.editorEmail, name: changeLog.editorName })
      .from(changeLog),
  ]);

  const editors = new Map<string, string>();
  for (const row of editorRows) {
    if (row.email && !editors.has(row.email)) editors.set(row.email, row.name || row.email);
  }
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminPageWidth>
      <h1 className="font-display text-3xl text-ink">Change History</h1>
      <p className="mt-1 mb-8 max-w-xl text-stone">
        Every change saved in this dashboard, newest first, with what it said
        before and after. Only you can see this page.
      </p>

      <form method="get" className="mb-8 flex max-w-xl flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <AdminSelect label="Show changes by" name="editor" defaultValue={editor ?? ""}>
            <option value="">Everyone</option>
            {[...editors].map(([email, name]) => (
              <option key={email} value={email}>
                {name === email ? email : `${name} (${email})`}
              </option>
            ))}
          </AdminSelect>
        </div>
        <button type="submit" className={buttonClass("secondary")}>
          Show
        </button>
      </form>

      {entries.length === 0 ? (
        <AdminEmptyState title="No changes yet">
          Changes will show up here as soon as someone saves something in the
          dashboard.
        </AdminEmptyState>
      ) : (
        <div className="space-y-10">
          {groupByDay(entries).map(([day, dayEntries]) => (
            <section key={day} aria-label={day}>
              <h2 className="mb-3 font-display text-xl text-ink">{day}</h2>
              <ul className="space-y-4">
                {dayEntries.map((entry) => (
                  <ChangeCard key={entry.id} entry={entry} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="More changes" className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {page > 1 ? (
            <Link href={pageHref(page - 1, editor)} className={buttonClass("secondary")}>
              Newer changes
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-stone">
            Page {page} of {pageCount}
          </p>
          {page < pageCount ? (
            <Link href={pageHref(page + 1, editor)} className={buttonClass("secondary")}>
              Older changes
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </AdminPageWidth>
  );
}
