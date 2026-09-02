import { SitePhoto, type SitePhotoSource } from "@/components/site-photo";

export function HeroPhotos({
  layout,
  photos = [],
  sizes,
  tileClassName = "",
  placeholderLabel,
  preloadFirst = false,
  revealOnScroll = false,
  className = "",
}: {
  layout: readonly string[];
  /** Lines up with `layout`. */
  photos?: readonly (SitePhotoSource | undefined)[];
  /** Lines up with `layout`. */
  sizes: readonly string[];
  tileClassName?: string;
  placeholderLabel: string;
  preloadFirst?: boolean;
  revealOnScroll?: boolean;
  className?: string;
}) {
  const tileEntrance = revealOnScroll ? "reveal-bloom" : "";
  return (
    <div
      className={`${revealOnScroll ? "reveal-stagger" : "enter-stagger"} ${className}`}
    >
      {layout.map((placement, i) => (
        <SitePhoto
          key={i}
          photo={photos[i]}
          sizes={sizes[i]}
          placeholderLabel={placeholderLabel}
          preload={preloadFirst && i === 0}
          className={`${tileEntrance} transition-transform duration-300 ease-out hover:-translate-y-1 ${tileClassName} ${placement}`}
        />
      ))}
    </div>
  );
}
