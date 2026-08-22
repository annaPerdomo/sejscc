import Image from "next/image";
import { PhotoPlaceholder } from "@/components/photo-placeholder";

/**
 * Contained, not cropped: groups upload either a photo or a logo and nothing
 * in the data tells them apart, and a cropped-through logo is unreadable.
 */
export function GroupMedia({
  src,
  placeholderLabel,
  sizes,
  muted = false,
  className = "",
}: {
  src: string | null;
  placeholderLabel: string;
  sizes: string;
  muted?: boolean;
  className?: string;
}) {
  if (!src) {
    return (
      <PhotoPlaceholder
        label={placeholderLabel}
        frame={false}
        className={`aspect-photo w-full ${className}`}
      />
    );
  }

  return (
    <div className={`relative aspect-photo w-full bg-mist ${className}`}>
      <div className="absolute inset-3">
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          className={`object-contain ${muted ? "opacity-55 grayscale" : ""}`}
        />
      </div>
    </div>
  );
}
