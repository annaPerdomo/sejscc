"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStickyTop } from "@/components/sticky-column";

// Zeffy's steps differ by ~600px or more; smaller changes are reflow.
const STEP_CHANGE = 160;

export function DonationPanel({
  id,
  children,
  className = "",
  panelClassName = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
  /** Its `scroll-mt-*` doubles as the clearance below the sticky site header. */
  panelClassName?: string;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stickyTop = useStickyTop(panelRef);
  const [stepChanges, setStepChanges] = useState(0);

  // Armed only after Zeffy's first report, and only at a fixed width: the jump
  // from the fallback height, or a rotation, is not a step change.
  useEffect(() => {
    const frame = panelRef.current?.querySelector("iframe");
    if (!frame) return;
    let last: { width: number; height: number } | null = null;

    const observer = new ResizeObserver(() => {
      if (!frame.style.height) return;
      const width = frame.offsetWidth;
      const height = frame.offsetHeight;
      if (last && last.width === width && height - last.height > STEP_CHANGE) {
        setStepChanges((count) => count + 1);
      }
      last = { width, height };
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel || stepChanges === 0) return;
    const { top } = panel.getBoundingClientRect();
    const clearance = Number.parseFloat(getComputedStyle(panel).scrollMarginTop) || 0;
    if (top >= clearance && top < window.innerHeight / 2) return;
    // Not smooth: Zeffy focuses the new step's first field as it renders,
    // and that focus scroll cancels a smooth scroll a few pixels in.
    anchor.scrollIntoView({ block: "start" });
  }, [stepChanges]);

  return (
    <div id={id} ref={anchorRef} className={className}>
      <div
        ref={panelRef}
        className={`lg:sticky ${panelClassName}`}
        style={stickyTop === null ? undefined : { top: stickyTop }}
      >
        {children}
      </div>
    </div>
  );
}
