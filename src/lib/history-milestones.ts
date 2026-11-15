import type { Milestone } from "@/components/history-timeline";
import type { Dictionary } from "@/lib/dictionaries";
import { historyAlbumPhotos, historyMilestonePhotos } from "@/lib/photos";

export function historyMilestones(history: Dictionary["home"]["history"]): Milestone[] {
  return history.milestones.map((step) => {
    const image = historyMilestonePhotos[step.id];
    return {
      year: step.year,
      era: step.era,
      title: step.title,
      text: step.text,
      photo: image ? { image, alt: step.photoAlt } : undefined,
      snapshots: history.album.flatMap((item) => {
        const snapshot = historyAlbumPhotos[item.id];
        return item.milestoneId === step.id && snapshot
          ? [{ ...item, photo: { image: snapshot, alt: item.photoAlt } }]
          : [];
      }),
    };
  });
}
