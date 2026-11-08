import Image from "next/image";
import { PhotoFrame } from "@/components/photo-frame";
import { PhotoPlaceholder } from "@/components/photo-placeholder";
import type { PhotoFraming } from "@/lib/photo-framing";

export type SitePhotoSource = { src: string; alt: string; framing?: PhotoFraming };

export function SitePhoto({
  photo,
  sizes,
  placeholderLabel,
  dark = false,
  shape = "rect",
  preload = false,
  className = "",
}: {
  photo?: SitePhotoSource;
  sizes: string;
  placeholderLabel: string;
  dark?: boolean;
  shape?: "rect" | "circle";
  preload?: boolean;
  className?: string;
}) {
  if (!photo) {
    return (
      <PhotoPlaceholder
        label={placeholderLabel}
        dark={dark}
        shape={shape}
        frame={false}
        className={`${shape === "circle" ? "rounded-full" : ""} ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative overflow-clip ${shape === "circle" ? "rounded-full" : ""} ${
        dark ? "bg-white/5" : "bg-mist"
      } ${className}`}
    >
      <PhotoFrame framing={photo.framing}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          preload={preload}
          sizes={sizes}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </PhotoFrame>
    </div>
  );
}
