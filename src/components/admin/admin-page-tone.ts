import type { EditablePageId } from "@/lib/editable-pages";

export const PAGE_TONES: Record<EditablePageId, { kanji: string; surface: string; rank: number }> = {
  events: { kanji: "祭", surface: "bg-peach", rank: 1 },
  groups: { kanji: "部", surface: "bg-lilac", rank: 2 },
  home: { kanji: "家", surface: "bg-azure", rank: 3 },
  donate: { kanji: "寄", surface: "bg-butter", rank: 4 },
  school: { kanji: "文", surface: "bg-celadon", rank: 5 },
};

export function byAdminPageOrder(a: { id: EditablePageId }, b: { id: EditablePageId }): number {
  return PAGE_TONES[a.id].rank - PAGE_TONES[b.id].rank;
}
