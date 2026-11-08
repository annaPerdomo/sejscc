"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { buttonClass } from "@/components/admin/admin-button";
import type { PhotoFraming } from "@/lib/photo-framing";
import { startPageFraming, type PageFramingSession } from "./page-edit-framing";
import {
  listenForPageEdits,
  markPageEditTargets,
  PHOTO_LAYER_CLASS,
  showPhotoButtons,
  type PageEditTarget,
} from "./page-edit-targets";

export type PageFraming = {
  key: string;
  framing: PhotoFraming;
  onChange: (next: PhotoFraming) => void;
  onUnavailable: () => void;
  onCancel: () => void;
  bar: ReactNode;
};

export function PageEditor({
  pageLabel,
  src,
  reloadKey,
  targets,
  bar,
  actions,
  framing,
  onFound,
  onPick,
  onFrame,
  onDone,
}: {
  pageLabel: string;
  src: string;
  reloadKey: number;
  targets: PageEditTarget[];
  bar: ReactNode;
  actions: ReactNode;
  framing?: PageFraming;
  onFound: (keys: ReadonlySet<string>) => void;
  onPick: (keys: string[]) => void;
  onFrame: (key: string) => void;
  onDone: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const targetsRef = useRef(targets);
  const onPickRef = useRef(onPick);
  const onFrameRef = useRef(onFrame);
  const onFoundRef = useRef(onFound);
  const lastFound = useRef("");
  const scroll = useRef({ src, top: 0 });
  const observerRef = useRef<MutationObserver | null>(null);
  const framingRef = useRef(framing);
  const sessionRef = useRef<PageFramingSession | null>(null);
  const [loadedKey, setLoadedKey] = useState<number | null>(null);

  useEffect(() => {
    targetsRef.current = targets;
    onPickRef.current = onPick;
    onFrameRef.current = onFrame;
    onFoundRef.current = onFound;
    framingRef.current = framing;
  });

  const framingKey = framing?.key;
  const loaded = loadedKey === reloadKey;
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    const active = framingRef.current;
    if (!framingKey || !loaded || !doc || !active) return;
    const session = startPageFraming(doc, framingKey, active.framing, (next) =>
      framingRef.current?.onChange(next)
    );
    if (!session) {
      active.onUnavailable();
      return;
    }
    sessionRef.current = session;
    return () => {
      session.stop();
      sessionRef.current = null;
    };
  }, [framingKey, loaded]);

  const draft = framing?.framing;
  useEffect(() => {
    if (draft) sessionRef.current?.apply(draft);
  }, [draft]);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => observerRef.current?.disconnect();
  }, []);

  function markTargets(doc: Document) {
    const found = markPageEditTargets(doc, targetsRef.current);
    const summary = [...found].sort().join(" ");
    if (summary === lastFound.current) return;
    lastFound.current = summary;
    onFoundRef.current(found);
  }

  function onFrameLoad() {
    const view = frameRef.current?.contentWindow;
    const doc = frameRef.current?.contentDocument;
    if (!view || !doc?.body) return;
    setLoadedKey(reloadKey);

    if (scroll.current.src === src) view.scrollTo({ top: scroll.current.top });
    else scroll.current = { src, top: 0 };
    view.addEventListener("scroll", () => {
      scroll.current = { src, top: view.scrollY };
    }, { passive: true });

    listenForPageEdits(doc, (keys) => onPickRef.current(keys));
    markTargets(doc);
    showPhotoButtons(
      doc,
      (keys) => onPickRef.current(keys),
      (key) => onFrameRef.current(key)
    );

    // Client components (slideshows, tabs) redraw after load; re-mark as they do.
    observerRef.current?.disconnect();
    let pending = false;
    observerRef.current = new MutationObserver((records) => {
      const layer = doc.querySelector(`.${PHOTO_LAYER_CLASS}`);
      const onlyPhotoButtons = records.every((record) => layer?.contains(record.target));
      if (pending || onlyPhotoButtons) return;
      pending = true;
      view.requestAnimationFrame(() => {
        pending = false;
        markTargets(doc);
      });
    });
    observerRef.current.observe(doc.body, { childList: true, subtree: true, characterData: true });
  }

  return (
    <dialog
      ref={dialogRef}
      className="page-editor"
      aria-label={`Changing the ${pageLabel}`}
      onCancel={(event) => {
        event.preventDefault();
        framingRef.current?.onCancel();
      }}
    >
      <div className="flex shrink-0 items-start gap-3 bg-navy px-4 py-3 text-white sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl">Edit {pageLabel}</h1>
            <p className="text-base text-sky sm:text-lg">
              Tap anything with a pink outline to change it.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            {actions}
            <button
              type="button"
              onClick={onDone}
              className={`min-h-12 text-lg ${buttonClass("on-dark-primary")}`}
            >
              Done
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDone}
          aria-label={`Close the ${pageLabel}`}
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {bar}
      <iframe
        key={reloadKey}
        ref={frameRef}
        src={src}
        title={`The ${pageLabel}, ready to change`}
        onLoad={onFrameLoad}
        className="min-h-0 w-full flex-1 bg-paper"
      />
      {framing?.bar}
    </dialog>
  );
}
