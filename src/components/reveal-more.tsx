"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** `children` renders unconditionally: it is what a visitor without JavaScript gets. */
export function RevealMore({
  more,
  moreLabel,
  lessLabel,
  children,
}: {
  more?: ReactNode;
  moreLabel: string;
  lessLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const revealed = useRef<HTMLDivElement>(null);
  const revealedId = useId();

  // The revealed cards sit above the button, so opening moves focus up to them —
  // tabbing forward would skip everything just added.
  useEffect(() => {
    if (open) revealed.current?.focus();
  }, [open]);

  return (
    <>
      {more && (
        <div id={revealedId} ref={revealed} tabIndex={-1} hidden={!open}>
          {more}
        </div>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        {more && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={revealedId}
            onClick={() => setOpen(!open)}
            className="rounded-lg border border-line bg-white px-5 py-2.5 font-display text-sm font-semibold text-indigo hover:border-indigo"
          >
            {open ? lessLabel : moreLabel}
          </button>
        )}
        {children}
      </div>
    </>
  );
}
