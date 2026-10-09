"use client";

import { useEffect, useRef } from "react";
import type { CalendarOption } from "@/lib/calendars";

const SUMMARY_TONES = {
  dark: "rounded-lg border-2 border-white/70 text-white hover:border-white hover:bg-white hover:text-navy",
  light: "button-outline",
};

const MENU_PLACEMENTS = {
  below: "top-full mt-2",
  above: "bottom-full mb-2",
};

export function AddToCalendar({
  label,
  menuLabel,
  options,
  tone,
  placement = "below",
  onOpenChange,
  className = "",
}: {
  label: string;
  menuLabel: string;
  options: CalendarOption[];
  tone: keyof typeof SUMMARY_TONES;
  /** "above" for a menu near the bottom of a clipped section. */
  placement?: keyof typeof MENU_PLACEMENTS;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  // A native <details> only closes from its own summary; a click elsewhere or
  // Escape should dismiss the menu like any other.
  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const onPointerDown = (event: PointerEvent) => {
      if (details.open && !details.contains(event.target as Node)) {
        details.open = false;
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") details.open = false;
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details
      ref={ref}
      onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
      className={`calendar-menu relative ${className}`}
    >
      <summary
        className={`block cursor-pointer px-7 py-3.5 text-center font-display text-base font-semibold tracking-[0.03em] transition-colors ${SUMMARY_TONES[tone]}`}
      >
        <span aria-hidden="true">📅 </span>
        {label}
      </summary>
      <div
        className={`menu-drop absolute left-0 z-20 min-w-64 ${MENU_PLACEMENTS[placement]} rounded-xl border border-line bg-paper p-2 shadow-2xl`}
      >
        <p className="px-3 pt-1.5 pb-2 font-display text-xs font-semibold tracking-[0.16em] text-ink-soft uppercase">
          {menuLabel}
        </p>
        <ul>
          {options.map((option) => (
            <li key={option.label}>
              <a
                href={option.href}
                target={option.external ? "_blank" : undefined}
                rel={option.external ? "noreferrer" : undefined}
                download={option.download ? "" : undefined}
                onClick={() => {
                  if (ref.current) ref.current.open = false;
                }}
                className="block rounded-lg px-3 py-2.5 font-display text-base font-semibold text-ink transition-colors hover:bg-mist"
              >
                {option.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
