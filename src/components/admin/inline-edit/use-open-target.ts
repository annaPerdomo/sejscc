"use client";

import { useState } from "react";

export const BLOCKED_MESSAGE = "Save or cancel your change first.";

export function useOpenTarget() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState<{ key: string; message: string } | null>(null);

  function isOpen(key: string): boolean {
    return openKey === key;
  }

  function blockedMessage(key: string): string | undefined {
    return blocked && blocked.key === key ? blocked.message : undefined;
  }

  function attemptOpen(key: string) {
    if (openKey !== null && openKey !== key && dirty) {
      setBlocked({ key, message: BLOCKED_MESSAGE });
      return;
    }
    setBlocked(null);
    setOpenKey(key);
    setDirty(false);
  }

  function close(key: string) {
    if (!isOpen(key)) return;
    setOpenKey(null);
    setDirty(false);
    setBlocked(null);
  }

  function setDirtyFor(key: string, nextDirty: boolean) {
    if (isOpen(key)) setDirty(nextDirty);
  }

  function fieldProps(key: string) {
    return {
      isOpen: isOpen(key),
      onOpen: () => attemptOpen(key),
      onClose: () => close(key),
      blocked: blockedMessage(key),
      onDirtyChange: (nextDirty: boolean) => setDirtyFor(key, nextDirty),
    };
  }

  return {
    close,
    fieldProps,
    isDirty: dirty,
    blockLanguageSwitch: () => (openKey !== null && dirty ? BLOCKED_MESSAGE : null),
    closeForLanguageSwitch: () => {
      setOpenKey(null);
      setDirty(false);
      setBlocked(null);
    },
  };
}

export type OpenTargetState = ReturnType<typeof useOpenTarget>;

export function focusByKey(key: string) {
  document
    .querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`)
    ?.focus();
}
