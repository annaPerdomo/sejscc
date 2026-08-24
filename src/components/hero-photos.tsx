import { SitePhoto, type SitePhotoSource } from "@/components/site-photo";

export function HeroPhotos({
  layout,
  photos = [],
  sizes,
  tileClassName = "",
  placeholderLabel,
  preloadFirst = false,
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
  className?: string;
}) {
  return (
    <div className={`reveal-rise ${className}`}>
      {layout.map((placement, i) => (
        <SitePhoto
          key={i}
          photo={photos[i]}
          sizes={sizes[i]}
          placeholderLabel={placeholderLabel}
          preload={preloadFirst && i === 0}
          className={`${tileClassName} ${placement}`}
        />
      ))}
    </div>
  );
}
