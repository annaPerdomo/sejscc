"use client";

import { buttonClass } from "@/components/admin/admin-button";

export function PagePreview({
  src,
  title,
  reloadKey,
  onReload,
}: {
  src: string;
  title: string;
  reloadKey: number;
  onReload: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-semibold text-ink-soft">Live preview</p>
        <button type="button" onClick={onReload} className={buttonClass("secondary")}>
          Reload
        </button>
      </div>
      <iframe
        key={reloadKey}
        src={src}
        title={title}
        className="mt-3 h-preview w-full rounded-lg border border-line bg-paper"
        loading="lazy"
      />
    </div>
  );
}
