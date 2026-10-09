"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { AdminAlert } from "@/components/admin/admin-alert";
import { AdminBadge } from "@/components/admin/admin-badge";
import { buttonClass, buttonVariantClass } from "@/components/admin/admin-button";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminTextArea } from "@/components/admin/admin-field";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import { EditDialog } from "@/components/admin/inline-edit/edit-dialog";
import { useUndo } from "@/components/admin/inline-edit/use-undo";
import { useUnsavedChangesGuard } from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import { PHOTO_PAGES, PHOTO_SLOTS, photoSlot, type PhotoShape } from "@/lib/photo-slots";
import {
  listUploadedPhotos,
  resetSitePhoto,
  updateSitePhoto,
  updateSitePhotoDescription,
} from "./actions";

const NO_OVERRIDE_MESSAGE =
  "This photo is back to the original, so there's no description to change.";
const TILE_SIZES = "(max-width: 640px) 50vw, 33vw";
const LIBRARY_SIZES = "33vw";

export type PhotoTile = {
  slot: string;
  current: { src: string; alt: string; altJa: string };
  original: { src: string; alt: string; altJa: string };
  isChanged: boolean;
};

const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";
const MISSING_ALT_MESSAGE = "Please describe the photo for visitors who can't see it.";

const SHAPE_CLASS: Record<PhotoShape, string> = {
  wide: "aspect-band",
  photo: "aspect-photo",
  square: "aspect-square",
};

type PickMode = "upload" | "library";

function groupSlots() {
  return PHOTO_PAGES.map((page) => {
    const slots = PHOTO_SLOTS.filter((slot) => slot.page === page.id);
    const groups: { group: string; slots: typeof slots }[] = [];
    for (const slot of slots) {
      const existing = groups.find((g) => g.group === slot.group);
      if (existing) existing.slots.push(slot);
      else groups.push({ group: slot.group, slots: [slot] });
    }
    return { page, groups };
  });
}

const PAGE_GROUPS = groupSlots();

export function PhotosCanvas({ tiles: initialTiles }: { tiles: PhotoTile[] }) {
  const router = useRouter();
  const [tiles, setTiles] = useState(initialTiles);
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string } | null>(null);
  const undo = useUndo();

  function tileFor(slot: string): PhotoTile {
    return tiles.find((t) => t.slot === slot)!;
  }

  function setTile(slot: string, next: Pick<PhotoTile, "current" | "isChanged">) {
    setTiles((current) => current.map((t) => (t.slot === slot ? { ...t, ...next } : t)));
  }

  async function onUndo() {
    const error = await undo.runUndo();
    setStatus(error ? { message: error } : null);
  }

  return (
    <div>
      <div aria-live="polite" className="mb-6 min-h-6 text-sm font-medium">
        {status && (
          <span className="text-indigo-deep">
            {status.message}
            {undo.entry && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => void onUndo()}
                  aria-disabled={undo.undoing}
                  className="font-semibold underline hover:text-indigo"
                >
                  {undo.undoing ? "Undoing…" : "Undo"}
                </button>
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {PHOTO_PAGES.map((page) => (
          <a key={page.id} href={`#photos-${page.id}`} className={buttonClass("secondary")}>
            {page.label}
          </a>
        ))}
      </div>

      <div className="mt-8 space-y-12">
        {PAGE_GROUPS.map(({ page, groups }) => (
          <section key={page.id} id={`photos-${page.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl text-ink">{page.label}</h2>
              <a
                href={page.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-indigo-deep underline hover:text-indigo"
              >
                Open this page<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            <div className="mt-4 space-y-8">
              {groups.map(({ group, slots }) => (
                <AdminCard key={group}>
                  <h3 className="font-display text-lg text-ink">{group}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {slots.map((slot) => {
                      const tile = tileFor(slot.id);
                      return (
                        <div key={slot.id} className="flex flex-col gap-2">
                          <div
                            className={`relative overflow-clip rounded-lg bg-mist ${SHAPE_CLASS[slot.shape]}`}
                          >
                            <Image
                              src={tile.current.src}
                              alt=""
                              fill
                              sizes={TILE_SIZES}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink">{slot.label}</span>
                            {tile.isChanged && <AdminBadge tone="pending">Changed</AdminBadge>}
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenSlot(slot.id)}
                            className={`min-h-11 w-full ${buttonClass("secondary")}`}
                          >
                            Change
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </AdminCard>
              ))}
            </div>
          </section>
        ))}
      </div>

      {openSlot && (
        <PhotoDialog
          tile={tileFor(openSlot)}
          onClose={() => setOpenSlot(null)}
          onSaved={(slot, next, previous, description) => {
            setTile(slot, next);
            setStatus({ message: description });
            // Replacing or removing an upload deletes its blob, so only a
            // change made to the still-original photo can be undone safely.
            if (previous.isChanged) {
              undo.clear();
            } else {
              undo.record({
                description,
                undo: async () => {
                  await resetSitePhoto(slot);
                  setTile(slot, { current: previous.current, isChanged: false });
                  router.refresh();
                },
              });
            }
            router.refresh();
          }}
          onReset={(slot, originalState, description) => {
            setTile(slot, { current: originalState, isChanged: false });
            setStatus({ message: description });
            undo.clear();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function PhotoDialog({
  tile,
  onClose,
  onSaved,
  onReset,
}: {
  tile: PhotoTile;
  onClose: () => void;
  onSaved: (
    slot: string,
    next: Pick<PhotoTile, "current" | "isChanged">,
    previous: PhotoTile,
    description: string
  ) => void;
  onReset: (slot: string, original: PhotoTile["current"], description: string) => void;
}) {
  const router = useRouter();
  const slot = photoSlot(tile.slot)!;
  const title = `${slot.group} — ${slot.label}`;
  const altOptional = slot.defaultAltPath === null;

  const [mode, setMode] = useState<PickMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [libraryUrl, setLibraryUrl] = useState<string | null>(null);
  const [library, setLibrary] = useState<{ url: string; uploadedAt: string }[] | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState(tile.current.alt);
  const [altJaDraft, setAltJaDraft] = useState(tile.current.altJa);
  const [altError, setAltError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const hasNewPhoto = Boolean(file || libraryUrl);
  const dirty =
    hasNewPhoto || altDraft !== tile.current.alt || altJaDraft !== tile.current.altJa;

  useUnsavedChangesGuard(dirty);

  function onFileChosen(chosen: File | null) {
    if (!chosen) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen));
    setLibraryUrl(null);
  }

  async function openLibrary() {
    setMode("library");
    if (library || libraryLoading) return;
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      setLibrary(await listUploadedPhotos());
    } catch (e) {
      setLibraryError(
        e instanceof Error && e.message ? e.message : "Couldn't load your uploaded photos."
      );
    } finally {
      setLibraryLoading(false);
    }
  }

  function pickFromLibrary(url: string) {
    setLibraryUrl(url);
    setFile(null);
    setPreviewUrl(null);
  }

  async function save() {
    if (saving) return;
    const alt = altDraft.trim();
    if (!alt && !altOptional) {
      setAltError(MISSING_ALT_MESSAGE);
      return;
    }
    if (!hasNewPhoto && !tile.isChanged) return;

    setAltError(null);
    setError(null);
    setSaving(true);

    const altJa = altJaDraft.trim();
    const previous = tile;

    try {
      let url = tile.current.src;
      if (file) {
        const result = await upload(`site/${tile.slot}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        url = result.url;
      } else if (libraryUrl) {
        url = libraryUrl;
      }

      if (hasNewPhoto) {
        await updateSitePhoto({ slot: tile.slot, url, alt, altJa });
      } else {
        await updateSitePhotoDescription({ slot: tile.slot, alt, altJa });
      }

      onSaved(
        tile.slot,
        { current: { src: url, alt, altJa }, isChanged: true },
        previous,
        `Changed ${slot.group}: ${slot.label}.`
      );
      onClose();
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
      setError(message);
      if (message === NO_OVERRIDE_MESSAGE) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function restoreOriginal() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await resetSitePhoto(tile.slot);
      onReset(tile.slot, tile.original, `Put back the original photo: ${slot.group}, ${slot.label}.`);
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  function chooseUploadMode() {
    setMode("upload");
    setLibraryUrl(null);
  }

  const pickerValue = mode === "upload" ? previewUrl : null;

  return (
    <EditDialog title={title} open busy={saving} onClose={onClose}>
      <div className="space-y-5">
        <div
          role="group"
          aria-label="Choose how to change this photo"
          className="inline-flex flex-wrap rounded-lg border border-line p-1"
        >
          <button
            type="button"
            aria-pressed={mode === "upload"}
            onClick={chooseUploadMode}
            className={`min-h-11 rounded-md px-4 text-sm font-semibold ${
              mode === "upload" ? buttonVariantClass("primary") : "text-ink-soft"
            }`}
          >
            Upload a new photo
          </button>
          <button
            type="button"
            aria-pressed={mode === "library"}
            onClick={() => void openLibrary()}
            className={`min-h-11 rounded-md px-4 text-sm font-semibold ${
              mode === "library" ? buttonVariantClass("primary") : "text-ink-soft"
            }`}
          >
            Use a photo already uploaded
          </button>
        </div>

        {mode === "upload" ? (
          <AdminImagePicker
            label="Photo"
            value={pickerValue}
            fallbackSrc={tile.current.src}
            onFileChosen={onFileChosen}
            disabled={saving}
          />
        ) : (
          <div>
            {libraryLoading && <p className="text-sm text-stone">Loading your photos…</p>}
            {libraryError && <AdminAlert>{libraryError}</AdminAlert>}
            {library && library.length === 0 && !libraryLoading && (
              <p className="text-sm text-stone">You haven&rsquo;t uploaded any photos yet.</p>
            )}
            {library && library.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {library.map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => pickFromLibrary(item.url)}
                    disabled={saving}
                    aria-pressed={libraryUrl === item.url}
                    aria-label={`Photo uploaded ${new Date(item.uploadedAt).toLocaleDateString("en-US")}`}
                    className={`relative aspect-square overflow-clip rounded-lg ${
                      libraryUrl === item.url ? "ring-2 ring-indigo" : ""
                    }`}
                  >
                    <Image src={item.url} alt="" fill sizes={LIBRARY_SIZES} className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tile.isChanged && (
          <button
            type="button"
            onClick={() => void restoreOriginal()}
            disabled={saving}
            className={`min-h-11 ${buttonClass("secondary")}`}
          >
            Use the original photo
          </button>
        )}

        {tile.isChanged || hasNewPhoto ? (
          <>
            <div>
              <AdminTextArea
                label={`Describe the photo (English${altOptional ? ", optional" : ""})`}
                value={altDraft}
                onChange={(event) => setAltDraft(event.target.value)}
                rows={3}
                maxLength={600}
                disabled={saving}
                aria-invalid={altError ? true : undefined}
                aria-describedby={altError ? "photo-alt-error" : undefined}
              />
              {altError && (
                <p id="photo-alt-error" role="alert" className="mt-1 text-sm font-medium text-magenta-deep">
                  {altError}
                </p>
              )}
            </div>
            <AdminTextArea
              label="Describe the photo (Japanese, optional)"
              value={altJaDraft}
              onChange={(event) => setAltJaDraft(event.target.value)}
              rows={3}
              maxLength={600}
              disabled={saving}
            />
          </>
        ) : (
          <p className="text-sm text-stone">
            The original photo&rsquo;s description is part of the website&rsquo;s words.
          </p>
        )}

        {error && <AdminAlert>{error}</AdminAlert>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void save()}
            aria-disabled={saving || (!hasNewPhoto && !tile.isChanged)}
            className={`min-h-12 ${buttonClass("primary")}`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!saving) onClose();
            }}
            aria-disabled={saving}
            className={`min-h-12 ${buttonClass("secondary")}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </EditDialog>
  );
}
