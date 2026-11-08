"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { expectOk } from "@/lib/action-result";
import { AdminButtonLink, buttonClass } from "@/components/admin/admin-button";
import { EditBar, type EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import { EditDialog } from "@/components/admin/inline-edit/edit-dialog";
import { EditableText } from "@/components/admin/inline-edit/editable-text";
import { EditableUrl } from "@/components/admin/inline-edit/editable-url";
import type { PageEditTarget } from "@/components/admin/inline-edit/page-edit-targets";
import { PageEditor } from "@/components/admin/inline-edit/page-editor";
import { PhotoFramingBar } from "@/components/admin/inline-edit/photo-framing-bar";
import {
  PhotoDialog,
  PhotoSlotEditor,
  PhotoSlotTile,
  photoSlotTitle,
  type PhotoTile,
} from "@/components/admin/inline-edit/photo-slot-tile";
import { useOpenTarget } from "@/components/admin/inline-edit/use-open-target";
import { useUndo, type UndoEntry } from "@/components/admin/inline-edit/use-undo";
import { useUnsavedChangesGuard } from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import type { EditablePage, ManagedElsewhere } from "@/lib/editable-pages";
import { DEFAULT_FRAMING, isDefaultFraming, sameFraming, type PhotoFraming } from "@/lib/photo-framing";
import { photoSlot, type PhotoSlot } from "@/lib/photo-slots";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { readPath } from "@/lib/object-path";
import { normalizeSiteLinkUrl, type SiteLink } from "@/lib/site-links";
import type { SiteTextField } from "@/lib/site-text-fields";
import {
  resetSiteLink,
  resetSitePhoto,
  resetSiteText,
  updateOriginalPhotoFraming,
  updateSiteLink,
  updateSitePhotoDetails,
  updateSiteText,
} from "../actions";
import {
  recordItems,
  type PageRecords,
  type RecordElsewhere,
  type RecordItem,
  type RecordPhoto,
  type RecordWords,
} from "./record-items";

type OverrideValue = { en: string | null; ja: string | null };
type OverridesRecord = Record<string, OverrideValue>;
type LinksRecord = Record<string, string | null>;

type PageItem =
  /** False for page words found on the page rather than named in the registry. */
  | { kind: "text"; field: SiteTextField; within: string | undefined; listed: boolean }
  | { kind: "link"; link: SiteLink; within: string | undefined }
  | { kind: "photo"; slot: PhotoSlot }
  | { kind: "record"; item: RecordItem };

type WordsItem =
  | Extract<PageItem, { kind: "text" | "link" }>
  | { kind: "record"; item: RecordWords };

function isWordsItem(item: PageItem): item is WordsItem {
  return item.kind === "text" || item.kind === "link" || (item.kind === "record" && item.item.kind === "recordWords");
}

type FramingDraft = { slot: PhotoSlot; draft: PhotoFraming; saving: boolean; error: string | null };

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";
const UNMOVED_PHOTO_MESSAGE =
  "Move or zoom the photo first, or press Cancel to leave it as it is.";
const PHOTO_NOT_SHOWING_MESSAGE =
  "That photo isn't showing on the page right now. Try again when it comes back around.";
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

function saveSlotFraming(slot: PhotoSlot, tile: PhotoTile, framing: PhotoFraming | undefined) {
  if (tile.isChanged) {
    const { alt, altJa } = tile.current;
    return updateSitePhotoDetails({ slot: slot.id, alt, altJa, framing: framing ?? DEFAULT_FRAMING });
  }
  return framing ? updateOriginalPhotoFraming({ slot: slot.id, framing }) : resetSitePhoto(slot.id);
}

export function PageCanvas({
  page,
  overrides: initialOverrides,
  links: initialLinks,
  en,
  ja,
  tiles: initialTiles,
  records,
  pageWords,
}: {
  page: EditablePage;
  overrides: OverridesRecord;
  links: LinksRecord;
  en: Dictionary;
  ja: Dictionary;
  tiles: Record<string, PhotoTile>;
  records: PageRecords;
  pageWords: SiteTextField[];
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState(initialOverrides);
  const [links, setLinks] = useState(initialLinks);
  const [tiles, setTiles] = useState(initialTiles);
  const [lang, setLang] = useState<Locale>("en");
  const [status, setStatus] = useState<EditBarStatus>({ kind: "idle" });
  const [reloadKey, setReloadKey] = useState(0);
  const [picked, setPicked] = useState<WordsItem[] | null>(null);
  const [pickedPhoto, setPickedPhoto] = useState<PhotoSlot | null>(null);
  const [photoGroup, setPhotoGroup] = useState<PhotoSlot[] | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [recordPhoto, setRecordPhoto] = useState<RecordPhoto | null>(null);
  const [recordElsewhere, setRecordElsewhere] = useState<RecordElsewhere | null>(null);
  const [foundKeys, setFoundKeys] = useState<ReadonlySet<string> | null>(null);
  const [framing, setFraming] = useState<FramingDraft | null>(null);

  const editState = useOpenTarget();
  const undo = useUndo();

  useUnsavedChangesGuard(editState.isDirty);

  function handleLangChange(nextLang: Locale) {
    if (nextLang === lang) return;
    const blockedMessage = editState.blockSwitch();
    if (blockedMessage) {
      setStatus({ kind: "error", message: blockedMessage });
      return;
    }
    editState.closeAll();
    setLang(nextLang);
  }

  function overrideFor(path: string): OverrideValue {
    return overrides[path] ?? NO_OVERRIDE;
  }

  function withOverride(path: string, forLang: Locale, value: string | null): OverridesRecord {
    const current = overrideFor(path);
    return { ...overrides, [path]: { ...current, [forLang]: value } };
  }

  function reloadPage() {
    setReloadKey((k) => k + 1);
  }

  function fieldText(fieldSpec: SiteTextField) {
    const current = overrideFor(fieldSpec.path);
    const overrideValue = lang === "en" ? current.en : current.ja;
    const dictValue = stringAt(lang === "en" ? en : ja, fieldSpec.path);
    return {
      current,
      changed: overrideValue !== null,
      dictValue,
      value: overrideValue ?? dictValue,
      fallback: lang === "ja" && !dictValue ? stringAt(en, fieldSpec.path) : undefined,
    };
  }

  function editProps(key: string, afterClose: (() => void) | undefined) {
    const props = editState.fieldProps(key);
    if (!afterClose) return props;
    return {
      ...props,
      onClose: () => {
        props.onClose();
        afterClose();
      },
    };
  }

  function renderRecordWords(item: RecordWords, afterClose?: () => void) {
    const stored = item.value(lang);
    const english = item.value("en") ?? "";
    const fallback = !item.shared && lang === "ja" && !stored ? english : undefined;
    const description = `Changed ${item.title.charAt(0).toLowerCase()}${item.title.slice(1)}.`;

    async function save(next: string) {
      const previous = (item.stored ? item.stored(lang) : stored) ?? "";
      setStatus({ kind: "saving" });
      try {
        expectOk(await item.save(lang, next));
        setStatus({ kind: "saved", message: description });
        undo.record({
          description,
          undo: async () => {
            expectOk(await item.save(lang, previous));
            router.refresh();
          },
        });
        router.refresh();
        reloadPage();
      } catch (e) {
        const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
        setStatus({ kind: "error", message });
        throw e;
      }
    }

    const languageNote = item.shared ? "the same in English and Japanese" : lang === "en" ? "English" : "Japanese";
    return (
      <div key={item.record} className={KIND_TEXT_CLASS[item.textKind]}>
        <EditableText
          key={`${item.record}-${lang}`}
          label={`${item.title} — ${languageNote}`}
          noun={item.title}
          value={stored ?? ""}
          fallback={fallback}
          placeholder={item.placeholder}
          multiline={item.textKind === "body"}
          maxLength={item.max}
          required={item.required(lang)}
          emptyMessage={EMPTY_FIELD_MESSAGE}
          {...editProps(item.record, afterClose)}
          onSave={save}
        />
      </div>
    );
  }

  function renderRecordPhoto(item: RecordPhoto) {
    return (
      <PhotoDialog
        spot={item.spot}
        actions={item.actions}
        tile={item.tile}
        onClose={() => setRecordPhoto(null)}
        onSaved={(_next, message) => {
          setStatus({ kind: "saved", message });
          undo.clear();
          router.refresh();
          reloadPage();
        }}
        onStatus={setStatus}
      />
    );
  }

  function renderField(fieldSpec: SiteTextField, afterClose?: () => void) {
    const { current, changed, dictValue, value, fallback } = fieldText(fieldSpec);

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
        reloadPage();
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
        reloadPage();
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
            {...editProps(fieldSpec.path, afterClose)}
            onSave={save}
          />
        </div>
        {changed && (
          <button
            type="button"
            onClick={() => void reset()}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-deep hover:underline"
          >
            Put the original words back
          </button>
        )}
      </div>
    );
  }

  function renderLink(link: SiteLink, afterClose?: () => void) {
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
        reloadPage();
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
          {...editProps(link.id, afterClose)}
          onSave={(next) => {
            const url = normalizeSiteLinkUrl(next) ?? link.defaultUrl;
            return applyLink(url === link.defaultUrl ? null : url, description);
          }}
        />
        {changed && (
          <button
            type="button"
            onClick={() =>
              void applyLink(null, `Put back the original ${link.label.toLowerCase()}.`).catch(() => undefined)
            }
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-deep hover:underline"
          >
            Put the original link back
          </button>
        )}
      </div>
    );
  }

  function onTileChange(next: PhotoTile) {
    setTiles((current) => ({ ...current, [next.slot]: next }));
  }

  function onPhotoSaved(next: PhotoTile, undoEntry?: UndoEntry) {
    const previous = tiles[next.slot];
    onTileChange(next);
    if (undoEntry) undo.record(undoEntry);
    else undo.clear();
    reloadPage();
    const slot = photoSlot(next.slot);
    const isNewPhoto = next.isChanged && next.current.src !== previous.current.src;
    const onPage = foundKeys?.has(`photo:${next.slot}`);
    if (slot && slot.framable !== false && isNewPhoto && onPage) startFraming(slot, next.current.framing);
  }

  function startFraming(slot: PhotoSlot, saved: PhotoFraming | undefined) {
    setPickedPhoto(null);
    setPhotoGroup(null);
    setFraming({ slot, draft: saved ?? DEFAULT_FRAMING, saving: false, error: null });
  }

  function frameOnPage(slot: PhotoSlot): (() => void) | undefined {
    if (slot.framable === false || !foundKeys?.has(`photo:${slot.id}`)) return undefined;
    return () => startFraming(slot, tiles[slot.id].current.framing);
  }

  async function saveFraming() {
    if (!framing || framing.saving) return;
    const { slot, draft } = framing;
    const tile = tiles[slot.id];
    const previous = tile.current.framing;
    if (sameFraming(draft, previous ?? DEFAULT_FRAMING)) {
      setFraming({ ...framing, error: UNMOVED_PHOTO_MESSAGE });
      return;
    }
    setFraming({ ...framing, saving: true, error: null });
    setStatus({ kind: "saving" });
    const description = `Moved ${photoSlotTitle(slot)}.`;
    try {
      const saved = isDefaultFraming(draft) ? undefined : draft;
      expectOk(await saveSlotFraming(slot, tile, saved));
      onTileChange({ ...tile, current: { ...tile.current, framing: saved } });
      undo.record({
        description,
        undo: async () => {
          expectOk(await saveSlotFraming(slot, tile, previous));
          onTileChange(tile);
          router.refresh();
        },
      });
      setStatus({ kind: "saved", message: description });
      setFraming(null);
      router.refresh();
      reloadPage();
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
      setFraming((current) => current && { ...current, saving: false, error: message });
      setStatus({ kind: "error", message });
    }
  }

  function renderPhotoTile(slot: PhotoSlot) {
    return (
      <PhotoSlotTile
        key={slot.id}
        slot={slot}
        tile={tiles[slot.id]}
        onSaved={onPhotoSaved}
        onTileChange={onTileChange}
        onStatus={setStatus}
        onFrameOnPage={frameOnPage(slot)}
      />
    );
  }

  async function onUndo() {
    const error = await undo.runUndo();
    setStatus(error ? { kind: "error", message: error } : { kind: "idle" });
    reloadPage();
    document.getElementById("admin-edit-bar")?.focus();
  }

  const pageItems = new Map<string, PageItem>();
  const photoSlots: PhotoSlot[] = [];
  const managedElsewhere: { label: string; manage: ManagedElsewhere }[] = [];
  for (const section of page.sections) {
    const within = section.anchor;
    for (const field of section.fields) {
      pageItems.set(`text:${field.path}`, { kind: "text", field, within, listed: true });
    }
    for (const link of section.links) pageItems.set(`link:${link.id}`, { kind: "link", link, within });
    for (const slot of section.photos) {
      pageItems.set(`photo:${slot.id}`, { kind: "photo", slot });
      photoSlots.push(slot);
    }
    if (section.manage) managedElsewhere.push({ label: section.label, manage: section.manage });
  }

  const sectionOfGroup = new Map<string, string>();
  for (const section of page.sections) {
    if (!section.anchor) continue;
    for (const field of section.fields) {
      const segments = field.path.split(".");
      if (segments.length > 2) sectionOfGroup.set(segments.slice(0, 2).join("."), section.anchor);
    }
  }
  for (const field of pageWords) {
    const within = sectionOfGroup.get(field.path.split(".").slice(0, 2).join("."));
    pageItems.set(`text:${field.path}`, { kind: "text", field, within, listed: false });
  }
  for (const item of recordItems(records)) {
    pageItems.set(`record:${item.record}`, { kind: "record", item });
  }

  function photosSharingSpot(slot: PhotoSlot): PhotoSlot[] {
    return photoSlots.filter((other) => other.section === slot.section && other.group === slot.group);
  }

  const pageEditTargets = [...pageItems].map(([key, item]): PageEditTarget => {
    switch (item.kind) {
      case "text": {
        const { value, fallback } = fieldText(item.field);
        return {
          key,
          label: item.field.label,
          within: item.within,
          secondary: !item.listed,
          kind: "text",
          text: value || fallback || "",
        };
      }
      case "link": {
        const href = links[item.link.id] ?? item.link.defaultUrl;
        return { key, label: item.link.label, within: item.within, kind: "link", href };
      }
      case "photo":
        return {
          key,
          label: item.slot.label,
          kind: "photo",
          src: tiles[item.slot.id].current.src,
          turns: item.slot.takesTurns ? photosSharingSpot(item.slot).length : 1,
        };
      case "record":
        return {
          key,
          label: item.item.title,
          kind: "record",
          record: item.item.record,
          photo: item.item.kind === "recordPhoto",
        };
    }
  });

  const notOnPage = foundKeys
    ? [...pageItems].filter(([key, item]) => {
        if (foundKeys.has(key) || item.kind === "record") return false;
        if (item.kind === "text" && !item.listed) return false;
        if (item.kind !== "photo") return true;
        return !photosSharingSpot(item.slot).some((other) => foundKeys.has(`photo:${other.id}`));
      })
    : [];

  function pickOnPage(keys: string[]) {
    const items = keys.map((key) => pageItems.get(key)).filter((item) => item !== undefined);
    for (const item of items) {
      if (item.kind !== "record") continue;
      if (item.item.kind === "recordPhoto") {
        setRecordPhoto(item.item);
        return;
      }
      if (item.item.kind === "recordElsewhere") {
        setRecordElsewhere(item.item);
        return;
      }
    }
    const [photo] = items.filter((item) => item.kind === "photo");
    if (photo) {
      if (photo.slot.takesTurns) setPhotoGroup(photosSharingSpot(photo.slot));
      else setPickedPhoto(photo.slot);
      return;
    }
    const words = items.filter(isWordsItem);
    const [first] = words;
    if (!first) return;
    if (words.length === 1) editState.fieldProps(editKeyOf(first)).onOpen();
    setPicked(words);
  }

  function editKeyOf(item: WordsItem): string {
    if (item.kind === "text") return item.field.path;
    if (item.kind === "link") return item.link.id;
    return item.item.record;
  }

  function pickedTitle(item: WordsItem): string {
    if (item.kind === "text") return item.field.label;
    if (item.kind === "link") return item.link.label;
    return item.item.title;
  }

  function closePicked() {
    editState.closeAll();
    setPicked(null);
  }

  const [pickedFirst] = picked ?? [];

  return (
    <>
      <PageEditor
        pageLabel={page.label}
        src={localizedHref(lang, page.href)}
        reloadKey={reloadKey}
        targets={pageEditTargets}
        bar={
          <EditBar
            lang={lang}
            onLangChange={handleLangChange}
            status={status}
            undo={
              undo.entry
                ? { description: undo.entry.description, busy: undo.undoing, onUndo: () => void onUndo() }
                : undefined
            }
          />
        }
        actions={
          (notOnPage.length > 0 || managedElsewhere.length > 0) && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`min-h-12 text-lg ${buttonClass("on-dark")}`}
            >
              Additional changes
            </button>
          )
        }
        framing={
          framing
            ? {
                key: `photo:${framing.slot.id}`,
                framing: framing.draft,
                onChange: (next) =>
                  setFraming((current) => current && { ...current, draft: next, error: null }),
                onUnavailable: () => {
                  setFraming(null);
                  setStatus({ kind: "error", message: PHOTO_NOT_SHOWING_MESSAGE });
                },
                onCancel: () => setFraming((current) => current && !current.saving ? null : current),
                bar: (
                  <PhotoFramingBar
                    title={photoSlotTitle(framing.slot)}
                    framing={framing.draft}
                    saving={framing.saving}
                    error={framing.error}
                    onChange={(next) =>
                      setFraming((current) => current && { ...current, draft: next, error: null })
                    }
                    onSave={() => void saveFraming()}
                    onCancel={() => {
                      if (!framing.saving) setFraming(null);
                    }}
                  />
                ),
              }
            : undefined
        }
        onFound={setFoundKeys}
        onPick={pickOnPage}
        onDone={() => router.push("/admin")}
      />

      {pickedPhoto && (
        <PhotoSlotEditor
          slot={pickedPhoto}
          tile={tiles[pickedPhoto.id]}
          onSaved={onPhotoSaved}
          onTileChange={onTileChange}
          onStatus={setStatus}
          onFrameOnPage={frameOnPage(pickedPhoto)}
          onClose={() => setPickedPhoto(null)}
        />
      )}

      {picked && pickedFirst && (
        <EditDialog
          title={picked.length > 1 ? "Choose which one to change" : pickedTitle(pickedFirst)}
          open
          dirty={editState.isDirty}
          onClose={closePicked}
        >
          {picked.length > 1 && (
            <p className="mb-4 text-base text-ink-soft">
              These same words appear in more than one place on the website. Changing one leaves the others as they are.
            </p>
          )}
          {picked.map((item) => {
            const editor =
              item.kind === "text"
                ? renderField(item.field, closePicked)
                : item.kind === "link"
                  ? renderLink(item.link, closePicked)
                  : renderRecordWords(item.item, closePicked);
            if (picked.length === 1) return editor;
            return (
              <div key={editKeyOf(item)}>
                <p className="font-display text-base font-semibold text-ink">{pickedTitle(item)}</p>
                <div className="mt-2">{editor}</div>
              </div>
            );
          })}
        </EditDialog>
      )}

      {recordPhoto && renderRecordPhoto(recordPhoto)}

      {recordElsewhere && (
        <EditDialog title={recordElsewhere.title} open onClose={() => setRecordElsewhere(null)}>
          <p className="text-lg text-ink-soft">{recordElsewhere.description}</p>
          <div className="mt-5">
            <AdminButtonLink href={recordElsewhere.href}>{recordElsewhere.action}</AdminButtonLink>
          </div>
        </EditDialog>
      )}

      {photoGroup && (
        <EditDialog title={photoGroup[0].group} open onClose={() => setPhotoGroup(null)}>
          <p className="text-base text-ink-soft">
            These photos take turns in the same spot. Choose the one you want to change.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">{photoGroup.map(renderPhotoTile)}</div>
        </EditDialog>
      )}

      {moreOpen && (
        <EditDialog
          title="Additional changes"
          open
          dirty={editState.isDirty}
          onClose={() => {
            editState.closeAll();
            setMoreOpen(false);
          }}
        >
          <div className="space-y-8">
            {notOnPage.length > 0 && (
              <section>
                <h3 className="font-display text-lg text-ink">Only shown at certain times</h3>
                <p className="mt-1 text-base text-ink-soft">
                  These aren&rsquo;t on the page right now, so they can&rsquo;t be tapped there.
                </p>
                <div className="mt-4">
                  {notOnPage.map(([key, item]) => {
                    if (item.kind === "text") return renderField(item.field);
                    if (item.kind === "link") return renderLink(item.link);
                    if (item.kind === "record") return null;
                    return (
                      <div key={key} className="max-w-60 py-4">
                        {renderPhotoTile(item.slot)}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {managedElsewhere.length > 0 && (
              <section>
                <h3 className="font-display text-lg text-ink">Changed on their own pages</h3>
                <ul className="mt-4 space-y-4">
                  {managedElsewhere.map(({ label, manage }) => (
                    <li key={label} className="rounded-lg bg-mist p-4">
                      <p className="font-display text-base text-ink">{label}</p>
                      <p className="mt-1 text-base text-ink-soft">{manage.description}</p>
                      <div className="mt-3">
                        <AdminButtonLink href={manage.href}>{manage.action}</AdminButtonLink>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </EditDialog>
      )}
    </>
  );
}
