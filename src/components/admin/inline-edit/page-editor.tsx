"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { buttonClass } from "@/components/admin/admin-button";
import {
  listenForPageEdits,
  markPageEditTargets,
  PHOTO_LAYER_CLASS,
  showPhotoButtons,
  type PageEditTarget,
} from "./page-edit-targets";

export function PageEditor({
  pageLabel,
  src,
  reloadKey,
  targets,
  bar,
  actions,
  onFound,
  onPick,
  onDone,
}: {
  pageLabel: string;
  src: string;
  reloadKey: number;
  targets: PageEditTarget[];
  bar: ReactNode;
  actions: ReactNode;
  onFound: (keys: ReadonlySet<string>) => void;
  onPick: (keys: string[]) => void;
  onDone: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const targetsRef = useRef(targets);
  const onPickRef = useRef(onPick);
  const onFoundRef = useRef(onFound);
  const lastFound = useRef("");
  const scroll = useRef({ src, top: 0 });
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    targetsRef.current = targets;
    onPickRef.current = onPick;
    onFoundRef.current = onFound;
  });

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

    if (scroll.current.src === src) view.scrollTo({ top: scroll.current.top });
    else scroll.current = { src, top: 0 };
    view.addEventListener("scroll", () => {
      scroll.current = { src, top: view.scrollY };
    }, { passive: true });

    listenForPageEdits(doc, (keys) => onPickRef.current(keys));
    markTargets(doc);
    showPhotoButtons(doc, (keys) => onPickRef.current(keys));

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
      onCancel={(event) => event.preventDefault()}
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
    </dialog>
  );
}
