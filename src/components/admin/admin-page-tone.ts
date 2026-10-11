import type { EditablePageId } from "@/lib/editable-pages";

export const PAGE_TONES: Record<EditablePageId, { surface: string; rank: number }> = {
  events: { surface: "bg-peach", rank: 1 },
  groups: { surface: "bg-lilac", rank: 2 },
  home: { surface: "bg-azure", rank: 3 },
  donate: { surface: "bg-butter", rank: 4 },
  school: { surface: "bg-celadon", rank: 5 },
};

export function byAdminPageOrder(a: { id: EditablePageId }, b: { id: EditablePageId }): number {
  return PAGE_TONES[a.id].rank - PAGE_TONES[b.id].rank;
}
