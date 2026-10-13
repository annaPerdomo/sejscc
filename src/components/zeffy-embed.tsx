"use client";

import { useEffect, useRef, useState } from "react";

const ZEFFY_ORIGIN = "https://www.zeffy.com";

const FRAME_ID = "sejscc-donate";

const MAX_REPORTED_HEIGHT = 4000;

const HEIGHT_TOLERANCE = 12;

// Zeffy runs iframe-resizer's (v4) child script, which reports heights only after
// this init. Only `lowestElement` tracks its content; the tolerance stops a 1–2px creep per resize.
const INIT_MESSAGE = `[iFrameSizer]${FRAME_ID}:8:false:false:32:true:true:null:lowestElement:null:null:${HEIGHT_TOLERANCE}:false:parent:scroll:true`;
const CHILD_READY = "[iFrameResizerChild]Ready";
const SIZE_PREFIX = `[iFrameSizer]${FRAME_ID}:`;

// These reuse the height field for a scroll offset, or carry no size at all.
const NON_SIZE_EVENTS = new Set([
  "scrollTo",
  "scrollToOffset",
  "scrollBy",
  "inPageLink",
  "pageInfo",
  "pageInfoStop",
  "parentInfo",
  "parentInfoStop",
  "message",
  "close",
  "title",
  "mouseenter",
  "mouseleave",
]);

function reportedHeight(data: unknown): number | null {
  if (typeof data !== "string" || !data.startsWith(SIZE_PREFIX)) return null;
  const [height, , event] = data.slice(SIZE_PREFIX.length).split(":");
  if (event === undefined || NON_SIZE_EVENTS.has(event)) return null;
  const parsed = Number.parseFloat(height);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(Math.ceil(parsed), MAX_REPORTED_HEIGHT);
}

// `className` must size the frame: it is the fallback if the handshake fails.
export function ZeffyEmbed({
  src,
  title,
  className = "",
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [nearby, setNearby] = useState(false);

  // Native lazy loading starts the form up to a few screens early, and its
  // payment scripts then compete with the rest of the page for bandwidth.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearby(true);
        observer.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== ZEFFY_ORIGIN) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data === CHILD_READY) {
        frameRef.current?.contentWindow?.postMessage(INIT_MESSAGE, ZEFFY_ORIGIN);
        return;
      }
      const reported = reportedHeight(event.data);
      if (reported !== null) setHeight(reported);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      title={title}
      src={nearby ? src : undefined}
      allow="payment"
      className={className}
      style={height ? { height, minHeight: 0 } : undefined}
    />
  );
}
