"use client";

import { useState } from "react";

export type UndoEntry = {
  description: string;
  undo: () => Promise<void>;
};

export function useUndo() {
  const [entry, setEntry] = useState<UndoEntry | null>(null);
  const [undoing, setUndoing] = useState(false);

  function record(next: UndoEntry) {
    setEntry(next);
  }

  function clear() {
    setEntry(null);
  }

  async function runUndo(): Promise<string | null> {
    if (!entry || undoing) return null;
    setUndoing(true);
    try {
      await entry.undo();
      return null;
    } catch (e) {
      return e instanceof Error && e.message
        ? e.message
        : "Something went wrong undoing that change. Please try again.";
    } finally {
      setUndoing(false);
      setEntry(null);
    }
  }

  return { entry, undoing, record, clear, runUndo };
}

export type UndoState = ReturnType<typeof useUndo>;
