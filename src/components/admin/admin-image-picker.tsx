"use client";

import { useState, type DragEvent } from "react";
import { buttonVariantClass } from "@/components/admin/admin-button";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function megabytes(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

// This component never creates or revokes `value`'s object URL — the caller
// owns that lifetime since it reuses the same URL for the live preview too.
export function AdminImagePicker({
  label,
  hint,
  value,
  fallbackSrc,
  onFileChosen,
  onRemove,
  previewShape = "rect",
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: string | null;
  fallbackSrc?: string;
  onFileChosen: (file: File | null) => void;
  onRemove?: () => void;
  previewShape?: "rect" | "circle";
  disabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function chooseFile(file: File | undefined | null) {
    setError(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(
        `That file is ${megabytes(file.size)} MB. Please choose a photo under 10 MB.`
      );
      return;
    }
    onFileChosen(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    chooseFile(event.dataTransfer.files?.[0]);
  }

  const preview = value ?? fallbackSrc ?? null;
  const previewRounding = previewShape === "circle" ? "rounded-full" : "rounded-lg";

  return (
    <div>
      <span className="block font-semibold text-ink">{label}</span>
      {hint && <p className="mt-1 text-sm text-stone">{hint}</p>}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-3 flex min-h-48 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-6 text-center sm:flex-row sm:text-left ${
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
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <p className="text-sm text-stone">Drag a photo here, or</p>
          <label
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-5 py-3 focus-within:ring-2 focus-within:ring-indigo focus-within:ring-offset-2 ${buttonVariantClass(
              "primary"
            )} ${disabled ? "pointer-events-none opacity-50" : ""}`}
          >
            Choose a photo
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              disabled={disabled}
              onChange={(event) => {
                chooseFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {onRemove && preview && (
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="min-h-11 text-sm font-medium text-indigo-deep hover:underline disabled:opacity-50"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-magenta-deep">
          {error}
        </p>
      )}
    </div>
  );
}
