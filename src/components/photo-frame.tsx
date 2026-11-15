"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { PHOTO_RATIO_ATTRIBUTE, framingStyle, type PhotoFraming } from "@/lib/photo-framing";

// The parent must be positioned and `overflow-clip`: the frame is an absolute
// box that grows past the parent's edges as the zoom rises.
export function PhotoFrame({
  framing,
  children,
}: {
  framing?: PhotoFraming;
  children: ReactNode;
}) {
  if (!framing) return children;
  return <MeasuredFrame framing={framing}>{children}</MeasuredFrame>;
}

// A whole photo is sized from its shape, which only the loaded image knows:
// its intrinsic size depends on which file the browser was served.
function MeasuredFrame({ framing, children }: { framing: PhotoFraming; children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const image = frame?.querySelector("img");
    if (!frame || !image) return;
    const measure = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      frame.style.setProperty("--photo-ratio", String(image.naturalWidth / image.naturalHeight));
      frame.setAttribute(PHOTO_RATIO_ATTRIBUTE, "");
    };
    measure();
    image.addEventListener("load", measure);
    return () => image.removeEventListener("load", measure);
  }, []);

  return (
    <div
      ref={frameRef}
      className={`photo-frame ${framing.fit === "whole" ? "photo-frame-whole" : ""}`}
      style={framingStyle(framing)}
    >
      {children}
    </div>
  );
}
