"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { expectOk, type ActionResult } from "@/lib/action-result";
import { AdminAlert } from "@/components/admin/admin-alert";
import { buttonClass, buttonVariantClass } from "@/components/admin/admin-button";
import { AdminTextArea } from "@/components/admin/admin-field";
import { AdminImagePicker } from "@/components/admin/admin-image-picker";
import type { EditBarStatus } from "@/components/admin/inline-edit/edit-bar";
import { EditDialog } from "@/components/admin/inline-edit/edit-dialog";
import { PHOTO_SHAPE_CLASS, PhotoFramer } from "@/components/admin/inline-edit/photo-framer";
import { PhotoFrame } from "@/components/photo-frame";
import { DEFAULT_FRAMING, sameFraming, type PhotoFraming } from "@/lib/photo-framing";
import {
  confirmDiscardChanges,
  useUnsavedChangesGuard,
} from "@/components/admin/inline-edit/use-unsaved-changes-guard";
import type { PhotoShape, PhotoSlot } from "@/lib/photo-slots";
import {
  listUploadedPhotos,
  resetSitePhoto,
  updateOriginalPhotoFraming,
  updateSitePhoto,
  updateSitePhotoDetails,
} from "@/app/admin/(dashboard)/pages/actions";

const NO_OVERRIDE_MESSAGE =
  "This photo is back to the original, so there's nothing here to change.";
const GENERIC_SAVE_ERROR = "Something went wrong saving this. Please try again.";
const MISSING_ALT_MESSAGE = "Please describe the photo for visitors who can't see it.";
const NOTHING_CHOSEN_MESSAGE = "Choose a new photo, or move or zoom this one, then press Save.";
const TILE_SIZES = "(max-width: 640px) 50vw, 33vw";
const LIBRARY_SIZES = "33vw";

type TilePhoto = { src: string; alt: string; altJa: string; framing?: PhotoFraming };

export type PhotoTile = {
  slot: string;
  current: TilePhoto;
  original: TilePhoto;
  isChanged: boolean;
};

type PickMode = "upload" | "library";

export type PhotoSpot = {
  title: string;
  shape: PhotoShape;
  framable: boolean;
  altOptional: boolean;
  /** False for a decorative photo (alt=""), which has no description to edit. */
  describable?: false;
  uploadFolder: string;
};

export type PhotoSaveActions = {
  replace: (input: { url: string; alt: string; altJa: string; framing: PhotoFraming }) => Promise<ActionResult>;
  /** Absent when only a new photo can be saved. */
  updateDetails?: (input: { alt: string; altJa: string; framing: PhotoFraming }) => Promise<ActionResult>;
  frameOriginal?: (framing: PhotoFraming) => Promise<ActionResult>;
  reset?: () => Promise<ActionResult>;
};

type PhotoSlotEditorProps = {
  slot: PhotoSlot;
  tile: PhotoTile;
  onSaved: (
    next: PhotoTile,
    undo?: { description: string; undo: () => Promise<void> }
  ) => void;
  onTileChange: (next: PhotoTile) => void;
  onStatus: (status: EditBarStatus) => void;
  onFrameOnPage?: () => void;
};

export function photoSlotTitle(slot: PhotoSlot): string {
  return `${slot.group} — ${slot.label}`;
}

export function PhotoSlotTile(props: PhotoSlotEditorProps) {
  const { slot, tile } = props;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className={`relative overflow-clip rounded-lg bg-mist ${PHOTO_SHAPE_CLASS[slot.shape]}`}>
        <PhotoFrame framing={tile.current.framing}>
          <Image
            src={tile.current.src}
            alt={tile.current.alt}
            fill
            sizes={TILE_SIZES}
            className="object-cover"
          />
        </PhotoFrame>
      </div>
      <span className="text-sm font-semibold text-ink">{slot.label}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Change ${slot.label}`}
        className={`min-h-11 w-full ${buttonClass("secondary")}`}
      >
        Change
      </button>

      {open && <PhotoSlotEditor {...props} onClose={() => setOpen(false)} />}
    </div>
  );
}

export function PhotoSlotEditor({
  slot,
  tile,
  onSaved,
  onTileChange,
  onStatus,
  onFrameOnPage,
  onClose,
}: PhotoSlotEditorProps & { onClose: () => void }) {
  const router = useRouter();

  function handleSaved(next: PhotoTile, description: string) {
    onSaved(
      next,
      // Replacing or removing an upload deletes its blob, so only a
      // change made to the still-original photo can be undone safely.
      tile.isChanged
        ? undefined
        : {
            description,
            undo: async () => {
              expectOk(await resetSitePhoto(slot.id));
              const framing = tile.current.framing;
              if (framing) expectOk(await updateOriginalPhotoFraming({ slot: slot.id, framing }));
              onTileChange(tile);
              router.refresh();
            },
          }
    );
    onStatus({ kind: "saved", message: description });
    router.refresh();
  }

  function handleReset(originalCurrent: PhotoTile["current"], description: string) {
    onSaved({ ...tile, current: originalCurrent, isChanged: false });
    onStatus({ kind: "saved", message: description });
    router.refresh();
  }

  return (
    <PhotoDialog
      spot={{
        title: photoSlotTitle(slot),
        shape: slot.shape,
        framable: slot.framable !== false,
        altOptional: slot.defaultAltPath === null,
        uploadFolder: `site/${slot.id}`,
      }}
      actions={{
        replace: (input) => updateSitePhoto({ slot: slot.id, ...input }),
        updateDetails: (input) => updateSitePhotoDetails({ slot: slot.id, ...input }),
        frameOriginal: (framing) => updateOriginalPhotoFraming({ slot: slot.id, framing }),
        reset: () => resetSitePhoto(slot.id),
      }}
      tile={tile}
      onClose={onClose}
      onSaved={handleSaved}
      onReset={handleReset}
      onStatus={onStatus}
      onFrameOnPage={onFrameOnPage}
    />
  );
}

export function PhotoDialog({
  spot,
  actions,
  tile,
  onClose,
  onSaved,
  onReset,
  onStatus,
  onFrameOnPage,
}: {
  spot: PhotoSpot;
  actions: PhotoSaveActions;
  tile: PhotoTile;
  onClose: () => void;
  onSaved: (next: PhotoTile, description: string) => void;
  onReset?: (original: PhotoTile["current"], description: string) => void;
  onStatus: (status: EditBarStatus) => void;
  onFrameOnPage?: () => void;
}) {
  const router = useRouter();
  const { title, altOptional } = spot;

  const [mode, setMode] = useState<PickMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [libraryUrl, setLibraryUrl] = useState<string | null>(null);
  const [library, setLibrary] = useState<{ url: string; uploadedAt: string }[] | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState(tile.current.alt);
  const [altJaDraft, setAltJaDraft] = useState(tile.current.altJa);
  const savedFraming = tile.current.framing ?? DEFAULT_FRAMING;
  const [framingDraft, setFramingDraft] = useState(savedFraming);
  const [altError, setAltError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const hasNewPhoto = Boolean(file || libraryUrl);
  const dirty =
    hasNewPhoto ||
    altDraft !== tile.current.alt ||
    altJaDraft !== tile.current.altJa ||
    !sameFraming(framingDraft, savedFraming);

  useUnsavedChangesGuard(dirty);

  function onFileChosen(chosen: File | null) {
    if (!chosen) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(chosen);
    setPreviewUrl(URL.createObjectURL(chosen));
    setLibraryUrl(null);
    setFramingDraft(DEFAULT_FRAMING);
    setError(null);
  }

  async function openLibrary() {
    setMode("library");
    if (library || libraryLoading) return;
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      setLibrary(expectOk(await listUploadedPhotos()));
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
    setError(null);
    setFile(null);
    setPreviewUrl(null);
    setFramingDraft(DEFAULT_FRAMING);
  }

  async function save() {
    if (saving || preparing) return;
    if (!hasNewPhoto && (!tile.current.src || !actions.updateDetails)) {
      setError(NOTHING_CHOSEN_MESSAGE);
      return;
    }
    if (!hasNewPhoto && actions.frameOriginal && !tile.isChanged) {
      await saveOriginalFraming(actions.frameOriginal);
      return;
    }
    const alt = altDraft.trim();
    if (!alt && !altOptional) {
      setAltError(MISSING_ALT_MESSAGE);
      return;
    }

    setAltError(null);
    setError(null);
    setSaving(true);
    onStatus({ kind: "saving" });

    const altJa = altJaDraft.trim();

    try {
      let url = tile.current.src;
      if (file) {
        const result = await upload(`${spot.uploadFolder}/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        url = result.url;
      } else if (libraryUrl) {
        url = libraryUrl;
      }

      const framing = framingDraft;
      if (hasNewPhoto || !actions.updateDetails) {
        expectOk(await actions.replace({ url, alt, altJa, framing }));
      } else {
        expectOk(await actions.updateDetails({ alt, altJa, framing }));
      }

      onSaved(
        { ...tile, current: { src: url, alt, altJa, framing }, isChanged: true },
        `Changed ${title}.`
      );
      onClose();
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
      setError(message);
      onStatus({ kind: "error", message });
      if (message === NO_OVERRIDE_MESSAGE) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveOriginalFraming(frameOriginal: (framing: PhotoFraming) => Promise<ActionResult>) {
    if (sameFraming(framingDraft, savedFraming)) {
      setError(NOTHING_CHOSEN_MESSAGE);
      return;
    }
    setError(null);
    setSaving(true);
    onStatus({ kind: "saving" });
    try {
      const framing = framingDraft;
      expectOk(await frameOriginal(framing));
      onSaved({ ...tile, current: { ...tile.current, framing } }, `Moved ${title}.`);
      onClose();
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
      setError(message);
      onStatus({ kind: "error", message });
    } finally {
      setSaving(false);
    }
  }

  async function restoreOriginal() {
    if (saving || !actions.reset) return;
    setSaving(true);
    setError(null);
    onStatus({ kind: "saving" });
    try {
      expectOk(await actions.reset());
      onReset?.(tile.original, `Put back the original photo: ${title}.`);
      onClose();
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : GENERIC_SAVE_ERROR;
      setError(message);
      onStatus({ kind: "error", message });
    } finally {
      setSaving(false);
    }
  }

  function chooseUploadMode() {
    setMode("upload");
    setLibraryUrl(null);
  }

  function closeDialog() {
    if (error) onStatus({ kind: "idle" });
    onClose();
  }

  const pickerValue = mode === "upload" ? previewUrl : null;
  const framesOnPage = spot.framable && Boolean(onFrameOnPage);
  const framerSrc =
    !spot.framable || framesOnPage
      ? null
      : (previewUrl ?? libraryUrl ?? tile.current.src);

  function frameOnPage() {
    if (saving || !onFrameOnPage || !confirmDiscardChanges(dirty)) return;
    closeDialog();
    onFrameOnPage();
  }

  return (
    <EditDialog title={title} open busy={saving} dirty={dirty} onClose={closeDialog}>
      <div className="space-y-5">
        {framesOnPage && !hasNewPhoto && (
          <div>
            <h3 className="text-lg font-semibold text-ink">Choose what shows</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Move or zoom the photo right on the page, so you see exactly what visitors will.
            </p>
            <button
              type="button"
              onClick={frameOnPage}
              aria-disabled={saving}
              className={`mt-3 min-h-12 ${buttonClass("primary")}`}
            >
              Move or zoom this photo
            </button>
          </div>
        )}
        {framesOnPage && hasNewPhoto && (
          <p className="text-sm text-ink-soft">
            After you save, the new photo opens on the page so you can choose what shows.
          </p>
        )}
        {framerSrc && (
          <PhotoFramer
            src={framerSrc}
            shape={spot.shape}
            framing={framingDraft}
            onChange={setFramingDraft}
            disabled={saving}
          />
        )}

        <h3 className="text-lg font-semibold text-ink">Use a different photo</h3>
        <div
          role="group"
          aria-label="Choose how to change this photo"
          className="inline-flex flex-wrap rounded-lg border border-line p-1"
        >
          <button
            type="button"
            aria-pressed={mode === "upload"}
            disabled={preparing}
            onClick={chooseUploadMode}
            className={`min-h-11 rounded-md px-4 text-sm font-semibold disabled:opacity-50 ${
              mode === "upload" ? buttonVariantClass("primary") : "text-ink-soft"
            }`}
          >
            Upload a new photo
          </button>
          <button
            type="button"
            aria-pressed={mode === "library"}
            disabled={preparing}
            onClick={() => void openLibrary()}
            className={`min-h-11 rounded-md px-4 text-sm font-semibold disabled:opacity-50 ${
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
            onPreparingChange={setPreparing}
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

        {tile.isChanged && actions.reset && (
          <button
            type="button"
            onClick={() => void restoreOriginal()}
            disabled={saving}
            className={`min-h-11 ${buttonClass("secondary")}`}
          >
            Use the original photo
          </button>
        )}

        {spot.describable === false ? null : tile.isChanged || hasNewPhoto ? (
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
            aria-disabled={saving || preparing}
            className={`min-h-12 ${buttonClass("primary")}`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!saving && confirmDiscardChanges(dirty)) closeDialog();
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
