"use client";

import { useState, type DragEvent } from "react";
import { buttonVariantClass } from "@/components/admin/admin-button";
import { PHOTO_TYPES, PHOTO_UNREADABLE_MESSAGE, asUploadablePhoto } from "@/lib/photo-upload";

// This component never creates or revokes `value`'s object URL — the caller
// owns that lifetime since it reuses the same URL for the live preview too.
export function AdminImagePicker({
  label,
  hint,
  value,
  fallbackSrc,
  onFileChosen,
  onRemove,
  onPreparingChange,
  previewShape = "rect",
  layout = "dropzone",
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: string | null;
  fallbackSrc?: string;
  onFileChosen: (file: File | null) => void;
  onRemove?: () => void;
  onPreparingChange?: (preparing: boolean) => void;
  previewShape?: "rect" | "circle";
  layout?: "dropzone" | "compact";
  disabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preparing, setPreparing] = useState(false);

  async function chooseFile(file: File | undefined | null) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "") {
      setError("That file isn't a photo. Please choose a JPG, PNG, or WebP photo.");
      return;
    }
    setPreparing(true);
    onPreparingChange?.(true);
    const uploadable = await asUploadablePhoto(file);
    setPreparing(false);
    onPreparingChange?.(false);
    if (!uploadable) {
      setError(PHOTO_UNREADABLE_MESSAGE);
      return;
    }
    onFileChosen(uploadable);
  }

  const pickerDisabled = disabled || preparing;

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (pickerDisabled) return;
    void chooseFile(event.dataTransfer.files?.[0]);
  }

  const preview = value ?? fallbackSrc ?? null;
  const previewRounding = previewShape === "circle" ? "rounded-full" : "rounded-lg";
  const compact = layout === "compact";

  const chooseButton = (
    <label
      className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-5 py-3 whitespace-nowrap focus-within:ring-2 focus-within:ring-indigo focus-within:ring-offset-2 ${buttonVariantClass(
        compact ? "secondary" : "primary"
      )} ${pickerDisabled ? "pointer-events-none opacity-50" : ""}`}
    >
      {preparing
        ? "Getting your photo ready…"
        : preview && value
          ? "Choose a different photo"
          : "Choose a photo"}
      <input
        type="file"
        accept={PHOTO_TYPES.join(",")}
        className="sr-only"
        disabled={pickerDisabled}
        onChange={(event) => {
          void chooseFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );

  const removeButton = onRemove && preview && (
    <button
      type="button"
      onClick={onRemove}
      disabled={disabled}
      className="min-h-11 text-sm font-medium text-indigo-deep hover:underline disabled:opacity-50"
    >
      Remove photo
    </button>
  );

  return (
    <div className="@container">
      <span className="block font-semibold text-ink">{label}</span>
      {hint && <p className="mt-1 text-sm text-stone">{hint}</p>}
      {compact ? (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className={`size-16 shrink-0 border border-line bg-white object-cover ${previewRounding}`}
            />
          ) : (
            <span
              aria-hidden="true"
              className={`flex size-16 shrink-0 items-center justify-center border border-dashed border-line bg-mist font-display text-xs text-stone ${previewRounding}`}
            >
              None
            </span>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {chooseButton}
            {removeButton}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!pickerDisabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-3 flex min-h-48 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-6 text-center @2xl:flex-row @2xl:text-left ${
            dragging ? "border-indigo bg-mist" : "border-line bg-mist"
          }`}
        >
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className={`aspect-photo w-full max-w-xs shrink-0 border border-line bg-white object-cover shadow-sm ${previewRounding}`}
            />
          )}
          <div className="flex flex-col items-center gap-3 @2xl:items-start">
            <p className="text-sm text-stone">Drag a photo here, or</p>
            {chooseButton}
            {removeButton}
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-magenta-deep">
          {error}
        </p>
      )}
    </div>
  );
}
