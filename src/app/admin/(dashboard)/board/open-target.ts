"use client";

import { useState } from "react";
import type { SectionTextField } from "@/components/volunteer-section";
import type { MemberTextField, RoleTextField } from "@/lib/volunteer-fields";

export type OpenTarget =
  | { kind: "section"; field: SectionTextField }
  | { kind: "member"; id: string; field: MemberTextField }
  | { kind: "role"; id: string; field: RoleTextField }
  | { kind: "add-member" }
  | { kind: "add-role" };

export const BLOCKED_MESSAGE = "Save or cancel your change first.";

function sameTarget(a: OpenTarget, b: OpenTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "section" && b.kind === "section") return a.field === b.field;
  if (a.kind === "member" && b.kind === "member") return a.id === b.id && a.field === b.field;
  if (a.kind === "role" && b.kind === "role") return a.id === b.id && a.field === b.field;
  return true;
}

export function useOpenTarget() {
  const [openTarget, setOpenTarget] = useState<OpenTarget | null>(null);
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState<{ target: OpenTarget; message: string } | null>(null);

  function isOpen(target: OpenTarget): boolean {
    return openTarget !== null && sameTarget(openTarget, target);
  }

  function blockedMessage(target: OpenTarget): string | undefined {
    return blocked && sameTarget(blocked.target, target) ? blocked.message : undefined;
  }

  function attemptOpen(target: OpenTarget) {
    if (openTarget && !sameTarget(openTarget, target) && dirty) {
      setBlocked({ target, message: BLOCKED_MESSAGE });
      return;
    }
    setBlocked(null);
    setOpenTarget(target);
    setDirty(false);
  }

  function close(target: OpenTarget) {
    if (!isOpen(target)) return;
    setOpenTarget(null);
    setDirty(false);
    setBlocked(null);
  }

  function setDirtyFor(target: OpenTarget, nextDirty: boolean) {
    if (isOpen(target)) setDirty(nextDirty);
  }

  function fieldProps(target: OpenTarget) {
    return {
      isOpen: isOpen(target),
      onOpen: () => attemptOpen(target),
      onClose: () => close(target),
      blocked: blockedMessage(target),
      onDirtyChange: (nextDirty: boolean) => setDirtyFor(target, nextDirty),
    };
  }

  return {
    close,
    fieldProps,
    isDirty: dirty,
    blockLanguageSwitch: () => (openTarget && dirty ? BLOCKED_MESSAGE : null),
    closeForLanguageSwitch: () => {
      setOpenTarget(null);
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
