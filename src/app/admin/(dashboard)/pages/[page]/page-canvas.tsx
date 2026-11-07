"use client";

import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { expectOk } from "@/lib/action-result";
import { AdminBadge } from "@/components/admin/admin-badge";
import { AdminButtonLink } from "@/components/admin/admin-button";
import { AdminDisclosure } from "@/components/admin/admin-disclosure";
import { EditBar, type EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import { EditableText } from "@/components/admin/inline-edit/editable-text";
import { EditableUrl } from "@/components/admin/inline-edit/editable-url";
import { PagePreview, type PreviewTarget } from "@/components/admin/inline-edit/page-preview";
import { PhotoSlotTile, type PhotoTile } from "@/components/admin/inline-edit/photo-slot-tile";
import { BLOCKED_MESSAGE, useOpenTarget } from "@/components/admin/inline-edit/use-open-target";
import { useUndo, type UndoEntry } from "@/components/admin/inline-edit/use-undo";
import { useUnsavedChangesGuard } from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import type { EditablePage, EditableSection } from "@/lib/editable-pages";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { readPath } from "@/lib/object-path";
import { normalizeSiteLinkUrl, type SiteLink } from "@/lib/site-links";
import type { SiteTextField } from "@/lib/site-text-fields";
import { resetSiteLink, resetSiteText, updateSiteLink, updateSiteText } from "../actions";

type OverrideValue = { en: string | null; ja: string | null };
type OverridesRecord = Record<string, OverrideValue>;
type LinksRecord = Record<string, string | null>;

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";
const EMPTY_FIELD_MESSAGE =
  "This spot on the website can't be left empty. Please type something, or press Cancel to keep the words as they are.";

const NO_OVERRIDE: OverrideValue = { en: null, ja: null };

const KIND_TEXT_CLASS: Record<SiteTextField["kind"], string> = {
  heading: "font-display text-2xl text-ink",
  body: "text-lg leading-relaxed text-ink-soft",
  short: "text-base text-ink",
};

function stringAt(dict: Dictionary, path: string): string {
  const value = readPath(dict, path);
  return typeof value === "string" ? value : "";
}

function localizedHref(lang: Locale, href: string): string {
  return href === "/" ? `/${lang}` : `/${lang}${href}`;
}

function countOf(n: number, singular: string, plural: string): string | null {
  if (n === 0) return null;
  return `${n} ${n === 1 ? singular : plural}`;
}

function sectionContents(section: EditableSection): string {
  const parts = [
    countOf(section.fields.length, "sentence", "sentences"),
    countOf(section.links.length, "link", "links"),
    countOf(section.photos.length, "photo", "photos"),
  ].filter((part) => part !== null);
  if (parts.length === 0 && section.manage) return "Changed on its own page";
  return parts.join(", ");
}

export function PageCanvas({
  page,
  overrides: initialOverrides,
  links: initialLinks,
  en,
  ja,
  tiles: initialTiles,
}: {
  page: EditablePage;
  overrides: OverridesRecord;
  links: LinksRecord;
  en: Dictionary;
  ja: Dictionary;
  tiles: Record<string, PhotoTile>;
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState(initialOverrides);
  const [links, setLinks] = useState(initialLinks);
  const [tiles, setTiles] = useState(initialTiles);
  const [lang, setLang] = useState<Locale>("en");
  const [status, setStatus] = useState<EditBarStatus>({ kind: "idle" });
  const [reloadKey, setReloadKey] = useState(0);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>({ anchor: null, nonce: 0 });

  function showInPreview(anchor: string | undefined) {
    setPreviewTarget((current) => ({ anchor: anchor ?? null, nonce: current.nonce + 1 }));
  }

  const editState = useOpenTarget();
  const undo = useUndo();

  useUnsavedChangesGuard(editState.isDirty);

  function handleLangChange(nextLang: Locale) {
    if (nextLang === lang) return;
    const blockedMessage = editState.blockLanguageSwitch();
    if (blockedMessage) {
      setStatus({ kind: "error", message: blockedMessage });
      return;
    }
    editState.closeForLanguageSwitch();
    setLang(nextLang);
  }

  function overrideFor(path: string): OverrideValue {
    return overrides[path] ?? NO_OVERRIDE;
  }

  function withOverride(path: string, forLang: Locale, value: string | null): OverridesRecord {
    const current = overrideFor(path);
    return { ...overrides, [path]: { ...current, [forLang]: value } };
  }

  function refreshPreviewAt(anchor: string | undefined) {
    showInPreview(anchor);
    setReloadKey((k) => k + 1);
  }

  function renderField(fieldSpec: SiteTextField, anchor: string | undefined) {
    const current = overrideFor(fieldSpec.path);
    const overrideValue = lang === "en" ? current.en : current.ja;
    const changed = overrideValue !== null;

    const dictValue = stringAt(lang === "en" ? en : ja, fieldSpec.path);
    const value = overrideValue ?? dictValue;
    const fallback = lang === "ja" && !dictValue ? stringAt(en, fieldSpec.path) : undefined;

    const description = `Changed ${fieldSpec.label}.`;

    async function save(next: string) {
      const trimmed = next.trim();
      const toStore = trimmed === dictValue.trim() ? "" : trimmed;
      const previous = current[lang];
      setOverrides(withOverride(fieldSpec.path, lang, toStore || null));
      setStatus({ kind: "saving" });
      try {
        expectOk(await updateSiteText(fieldSpec.path, lang, toStore));
        setStatus({ kind: "saved", message: description });
        undo.record({
          description,
          undo: async () => {
            setOverrides(withOverride(fieldSpec.path, lang, previous));
            try {
              if (previous === null) {
                expectOk(await resetSiteText(fieldSpec.path, lang));
              } else {
                expectOk(await updateSiteText(fieldSpec.path, lang, previous));
              }
              router.refresh();
            } catch (e) {
              setOverrides(withOverride(fieldSpec.path, lang, toStore || null));
              const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
              setStatus({ kind: "error", message });
              throw e;
            }
          },
        });
        router.refresh();
        refreshPreviewAt(anchor);
      } catch (e) {
        setOverrides(withOverride(fieldSpec.path, lang, previous));
        const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
        setStatus({ kind: "error", message });
        throw e;
      }
    }

    async function reset() {
      const previous = current[lang];
      const resetDescription = `Put back the original ${fieldSpec.label.toLowerCase()}.`;
      setOverrides(withOverride(fieldSpec.path, lang, null));
      setStatus({ kind: "saving" });
      try {
        expectOk(await resetSiteText(fieldSpec.path, lang));
        setStatus({ kind: "saved", message: resetDescription });
        undo.record({
          description: resetDescription,
          undo: async () => {
            setOverrides(withOverride(fieldSpec.path, lang, previous));
            try {
              expectOk(await updateSiteText(fieldSpec.path, lang, previous ?? ""));
              router.refresh();
            } catch (e) {
              setOverrides(withOverride(fieldSpec.path, lang, null));
              const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
              setStatus({ kind: "error", message });
              throw e;
            }
          },
        });
        router.refresh();
        refreshPreviewAt(anchor);
      } catch (e) {
        setOverrides(withOverride(fieldSpec.path, lang, previous));
        const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
        setStatus({ kind: "error", message });
      }
    }

    return (
      <div
        key={fieldSpec.path}
        className="border-t border-line py-4 first:border-t-0 first:pt-0"
      >
        <div className={KIND_TEXT_CLASS[fieldSpec.kind]}>
          <EditableText
            key={`${fieldSpec.path}-${lang}`}
            label={`${fieldSpec.label} — ${lang === "en" ? "English" : "Japanese"}`}
            noun={fieldSpec.label}
            value={value}
            fallback={fallback}
            multiline={fieldSpec.kind !== "heading"}
            maxLength={fieldSpec.max}
            required
            emptyMessage={EMPTY_FIELD_MESSAGE}
            {...editState.fieldProps(fieldSpec.path)}
            onSave={save}
          />
        </div>
        {changed && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <AdminBadge tone="pending">Changed</AdminBadge>
            <button
              type="button"
              onClick={() => void reset()}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-deep hover:underline"
            >
              Put the original words back
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderLink(link: SiteLink, anchor: string | undefined) {
    const stored = links[link.id] ?? null;
    const value = stored ?? link.defaultUrl;
    const changed = stored !== null;
    const description = `Changed the ${link.label.toLowerCase()}.`;

    async function applyLink(next: string | null, message: string) {
      const previous = stored;
      setLinks((current) => ({ ...current, [link.id]: next }));
      setStatus({ kind: "saving" });
      try {
        expectOk(next === null ? await resetSiteLink(link.id) : await updateSiteLink(link.id, next));
        setStatus({ kind: "saved", message });
        undo.record({
          description: message,
          undo: async () => {
            setLinks((current) => ({ ...current, [link.id]: previous }));
            try {
              expectOk(
                previous === null ? await resetSiteLink(link.id) : await updateSiteLink(link.id, previous)
              );
              router.refresh();
            } catch (e) {
              setLinks((current) => ({ ...current, [link.id]: next }));
              const errorMessage = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
              setStatus({ kind: "error", message: errorMessage });
              throw e;
            }
          },
        });
        router.refresh();
        refreshPreviewAt(anchor);
      } catch (e) {
        setLinks((current) => ({ ...current, [link.id]: previous }));
        const errorMessage = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
        setStatus({ kind: "error", message: errorMessage });
        throw e;
      }
    }

    return (
      <div key={link.id} className="border-t border-line py-4 first:border-t-0 first:pt-0">
        <EditableUrl
          label={link.label}
          help={link.help}
          value={value}
          {...editState.fieldProps(link.id)}
          onSave={(next) => {
            const url = normalizeSiteLinkUrl(next) ?? link.defaultUrl;
            return applyLink(url === link.defaultUrl ? null : url, description);
          }}
        />
        {changed && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <AdminBadge tone="pending">Changed</AdminBadge>
            <button
              type="button"
              onClick={() =>
                void applyLink(null, `Put back the original ${link.label.toLowerCase()}.`).catch(() => undefined)
              }
              className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-deep hover:underline"
            >
              Put the original link back
            </button>
          </div>
        )}
      </div>
    );
  }

  function onSectionToggle(event: SyntheticEvent<HTMLDetailsElement>, section: EditableSection) {
    const details = event.currentTarget;
    if (details.open) {
      showInPreview(section.anchor);
      return;
    }
    if (editState.isDirty && details.querySelector("[data-inline-edit-open]")) {
      details.open = true;
      setStatus({ kind: "error", message: BLOCKED_MESSAGE });
    }
  }

  function onTileChange(next: PhotoTile) {
    setTiles((current) => ({ ...current, [next.slot]: next }));
  }

  function onPhotoSaved(next: PhotoTile, anchor: string | undefined, undoEntry?: UndoEntry) {
    onTileChange(next);
    if (undoEntry) undo.record(undoEntry);
    else undo.clear();
    refreshPreviewAt(anchor);
  }

  async function onUndo() {
    const error = await undo.runUndo();
    setStatus(error ? { kind: "error", message: error } : { kind: "idle" });
    setReloadKey((k) => k + 1);
    document.getElementById("admin-edit-bar")?.focus();
  }

  const viewHref = localizedHref(lang, page.href);
  const sections = page.sections.filter(
    (section) =>
      section.manage || section.fields.length > 0 || section.links.length > 0 || section.photos.length > 0
  );

  return (
    <div>
      <EditBar
        lang={lang}
        onLangChange={handleLangChange}
        status={status}
        viewHref={viewHref}
        undo={
          undo.entry
            ? { description: undo.entry.description, busy: undo.undoing, onUndo: () => void onUndo() }
            : undefined
        }
      />

      <div className="mx-auto max-w-7xl py-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="space-y-4">
          {sections.map((section) => (
            <AdminDisclosure
              key={section.id}
              onToggle={(event) => onSectionToggle(event, section)}
              summary={
                <h2 className="min-w-0 font-display text-lg text-ink">
                  {section.label}
                  <span className="mt-0.5 block font-sans text-base text-ink-soft">
                    {sectionContents(section)}
                  </span>
                </h2>
              }
            >
              {section.manage && (
                <div className="mt-5 flex flex-col gap-3 rounded-lg bg-mist p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base text-ink-soft">{section.manage.description}</p>
                  <div className="shrink-0">
                    <AdminButtonLink href={section.manage.href}>{section.manage.action}</AdminButtonLink>
                  </div>
                </div>
              )}
              {section.fields.length > 0 && (
                <div className="mt-5">{section.fields.map((fieldSpec) => renderField(fieldSpec, section.anchor))}</div>
              )}
              {section.links.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-display text-base font-semibold text-ink-soft">Links</h3>
                  <div className="mt-3">{section.links.map((link) => renderLink(link, section.anchor))}</div>
                </div>
              )}
              {section.photos.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-display text-base font-semibold text-ink-soft">Photos</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {section.photos.map((slot) => (
                      <PhotoSlotTile
                        key={slot.id}
                        slot={slot}
                        tile={tiles[slot.id]}
                        onSaved={(next, undoEntry) => onPhotoSaved(next, section.anchor, undoEntry)}
                        onTileChange={onTileChange}
                        onStatus={setStatus}
                      />
                    ))}
                  </div>
                </div>
              )}
            </AdminDisclosure>
          ))}
        </div>

        <div className="hidden lg:sticky lg:top-20 lg:block">
          <PagePreview
            src={viewHref}
            target={previewTarget}
            title={`Preview of the ${page.label}`}
            reloadKey={reloadKey}
            onReload={() => setReloadKey((k) => k + 1)}
          />
        </div>
      </div>
    </div>
  );
}
