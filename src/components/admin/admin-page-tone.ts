import type { EditablePageId } from "@/lib/editable-pages";

export const PAGE_TONES: Record<EditablePageId, { kanji: string; surface: string }> = {
  home: { kanji: "家", surface: "bg-azure" },
  school: { kanji: "文", surface: "bg-celadon" },
  events: { kanji: "祭", surface: "bg-peach" },
  groups: { kanji: "部", surface: "bg-lilac" },
  donate: { kanji: "寄", surface: "bg-butter" },
};
