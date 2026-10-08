"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useInlineEditFocus(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null>,
  buttonRef: RefObject<HTMLButtonElement | null>,
  fieldRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>
) {
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (isOpen) {
      const field = fieldRef.current;
      field?.focus();
      field?.setSelectionRange(field.value.length, field.value.length);
      return;
    }

    if (!wasOpen) return;
    const active = document.activeElement;
    const focusWasHere = active === document.body || (containerRef.current?.contains(active) ?? false);
    if (focusWasHere) buttonRef.current?.focus();
  }, [isOpen, containerRef, buttonRef, fieldRef]);
}
