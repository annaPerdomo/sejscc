"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";

const ZOOM_FACTOR = 1.75;

type Labels = {
  open: string;
  title: string;
  hint: string;
  close: string;
  zoomIn: string;
  zoomOut: string;
};

export function ZoomablePhoto({
  photo,
  labels,
  className = "",
}: {
  photo: { src: string; alt: string; width: number; height: number };
  labels: Labels;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ x: 0.5, y: 0.5 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const observer = new ResizeObserver((entries) => {
      if (entries.some((entry) => entry.target === scroller) && scroller.clientWidth > 0) {
        const largest = Math.max(1, photo.width / scroller.clientWidth);
        setFitWidth(scroller.clientWidth);
        setMaxZoom(largest);
        setZoom((current) => Math.min(largest, current));
      }
      const { x, y } = centerRef.current;
      scroller.scrollLeft = x * scroller.scrollWidth - scroller.clientWidth / 2;
      scroller.scrollTop = y * scroller.scrollHeight - scroller.clientHeight / 2;
    });
    observer.observe(scroller);
    observer.observe(content);
    return () => observer.disconnect();
  }, [photo.width]);

  function rememberCenter() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    centerRef.current = {
      x: (scroller.scrollLeft + scroller.clientWidth / 2) / scroller.scrollWidth,
      y: (scroller.scrollTop + scroller.clientHeight / 2) / scroller.scrollHeight,
    };
  }

  function open() {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    if (!dialog || !scroller) return;
    dialog.showModal();
    const width = scroller.clientWidth;
    const largest = Math.max(1, photo.width / width);
    const fillHeight = (scroller.clientHeight * 0.85) / ((width * photo.height) / photo.width);
    centerRef.current = { x: 0.5, y: 0.5 };
    setFitWidth(width);
    setMaxZoom(largest);
    setZoom(Math.min(largest, Math.max(1, fillHeight)));
  }

  function zoomBy(factor: number) {
    rememberCenter();
    setZoom((current) => Math.min(maxZoom, Math.max(1, current * factor)));
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    const start = dragRef.current;
    if (!start) return;
    event.currentTarget.scrollLeft -= event.clientX - start.x;
    event.currentTarget.scrollTop -= event.clientY - start.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
  }

  function endDrag() {
    dragRef.current = null;
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className={`group relative block w-full overflow-clip focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-gold ${className}`}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes="100vw"
          className="ken-burns-in block h-auto min-h-64 w-full object-cover object-bottom sm:min-h-80 lg:min-h-0"
        />
        <span className="button-light absolute right-4 bottom-4 flex items-center gap-2 rounded-full px-5 py-3 font-display text-base font-semibold sm:right-6 sm:bottom-6">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6" />
          </svg>
          {labels.open}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={labels.title}
        className="photo-viewer"
        onKeyDown={(event) => {
          if (event.metaKey || event.ctrlKey || event.altKey) return;
          if (event.key === "+" || event.key === "=") zoomBy(ZOOM_FACTOR);
          if (event.key === "-") zoomBy(1 / ZOOM_FACTOR);
        }}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-gold/50 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-white">{labels.title}</h2>
            <p className="text-base text-white/80">{labels.hint}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => zoomBy(1 / ZOOM_FACTOR)}
              aria-disabled={zoom <= 1}
              aria-label={labels.zoomOut}
              className="carousel-button h-12 w-12 text-2xl font-semibold aria-disabled:opacity-40"
            >
              <span aria-hidden="true">−</span>
            </button>
            <button
              type="button"
              onClick={() => zoomBy(ZOOM_FACTOR)}
              aria-disabled={zoom >= maxZoom}
              aria-label={labels.zoomIn}
              className="carousel-button h-12 w-12 text-2xl font-semibold aria-disabled:opacity-40"
            >
              <span aria-hidden="true">+</span>
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="button-light ml-2 rounded-full px-5 py-3 font-display text-base font-semibold"
            >
              {labels.close}
            </button>
          </div>
        </div>
        <div
          ref={scrollerRef}
          tabIndex={0}
          role="region"
          aria-label={labels.hint}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="min-h-0 flex-1 cursor-grab overflow-auto overscroll-contain active:cursor-grabbing focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-gold"
        >
          <div ref={contentRef} className="flex min-h-full w-max min-w-full items-center justify-center">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              unoptimized
              draggable={false}
              loading="lazy"
              style={{ width: zoom * fitWidth }}
              className="block h-auto max-w-none select-none"
            />
          </div>
        </div>
      </dialog>
    </>
  );
}
