"use client";

import { useEffect, useRef } from "react";
import { buttonClass } from "@/components/admin/admin-button";
import { PREVIEW_TOP } from "@/lib/editable-pages";

export type PreviewTarget = { anchor: string | null; nonce: number };

export function PagePreview({
  src,
  target,
  title,
  reloadKey,
  onReload,
}: {
  src: string;
  target: PreviewTarget;
  title: string;
  reloadKey: number;
  onReload: () => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Navigating the frame to a fragment would scroll the admin page too, so
  // the frame's own window is scrolled instead.
  function scrollToAnchor() {
    const frameWindow = frameRef.current?.contentWindow;
    if (!frameWindow) return;
    const anchor = target.anchor;
    try {
      if (!anchor || anchor === PREVIEW_TOP) {
        frameWindow.scrollTo({ top: 0 });
        return;
      }
      const target = frameWindow.document.getElementById(anchor);
      if (!target) return;
      const margin = parseFloat(frameWindow.getComputedStyle(target).scrollMarginTop) || 0;
      frameWindow.scrollTo({
        top: target.getBoundingClientRect().top + frameWindow.scrollY - margin,
      });
    } catch {
      return;
    }
  }

  useEffect(scrollToAnchor, [target]);

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
        ref={frameRef}
        src={src}
        title={title}
        onLoad={scrollToAnchor}
        className="mt-3 h-preview w-full rounded-lg border border-line bg-paper"
        loading="lazy"
      />
    </div>
  );
}
