import { PhotoPlaceholder } from "@/components/photo-placeholder";

export function HeroPhotos({
  layout,
  tileClassName = "",
  placeholderLabel,
  className = "",
}: {
  layout: readonly string[];
  tileClassName?: string;
  placeholderLabel: string;
  className?: string;
}) {
  return (
    <div className={`reveal-rise ${className}`}>
      {layout.map((placement, i) => (
        <PhotoPlaceholder
          key={i}
          label={placeholderLabel}
          frame={false}
          className={`${tileClassName} ${placement}`}
        />
      ))}
    </div>
  );
}
